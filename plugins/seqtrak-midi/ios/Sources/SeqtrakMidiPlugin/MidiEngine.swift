import Foundation
import CoreMIDI

enum MidiError: Error, LocalizedError {
    case coreMidi(String, OSStatus)
    case notConnected
    case endpointNotFound
    case badMessage(String)

    var errorDescription: String? {
        switch self {
        case .coreMidi(let call, let status): return "\(call) failed (\(status))"
        case .notConnected: return "No MIDI device is connected"
        case .endpointNotFound: return "That MIDI port is no longer available"
        case .badMessage(let why): return why
        }
    }
}

struct MidiEndpoint {
    let id: Int32
    let name: String
    let ref: MIDIEndpointRef
}

/// CoreMIDI access for one device: lists ports, connects one input and one output, sends SysEx,
/// and reassembles incoming SysEx into complete F0 ... F7 messages.
///
/// It uses the byte-stream packet API (MIDIPacketList) rather than the newer event-list API
/// because SysEx arrives there as plain bytes; Xcode marks two of these calls as deprecated,
/// which is only a warning.
final class MidiEngine {
    var onSysex: (([UInt8]) -> Void)?
    var onSetupChanged: (() -> Void)?

    private var client = MIDIClientRef()
    private var inPort = MIDIPortRef()
    private var outPort = MIDIPortRef()
    private var source: MIDIEndpointRef = 0
    private var destination: MIDIEndpointRef = 0
    private var started = false

    private var sysex: [UInt8] = []
    private var inSysex = false
    private let maxSysexLength = 65_536

    // Sends run one at a time, off the main thread, so pacing sleeps never block the UI.
    private let sendQueue = DispatchQueue(label: "net.kktp.trakforge.midi.send")

    func start() throws {
        if started { return }
        var status = MIDIClientCreateWithBlock("TrakForge" as CFString, &client) { [weak self] notification in
            if notification.pointee.messageID == .msgSetupChanged {
                self?.onSetupChanged?()
            }
        }
        guard status == noErr else { throw MidiError.coreMidi("MIDIClientCreate", status) }

        status = MIDIInputPortCreateWithBlock(client, "TrakForge In" as CFString, &inPort) { [weak self] packetList, _ in
            self?.receive(packetList)
        }
        guard status == noErr else { throw MidiError.coreMidi("MIDIInputPortCreate", status) }

        status = MIDIOutputPortCreate(client, "TrakForge Out" as CFString, &outPort)
        guard status == noErr else { throw MidiError.coreMidi("MIDIOutputPortCreate", status) }
        started = true
    }

    // MARK: Ports

    func sources() -> [MidiEndpoint] {
        (0..<MIDIGetNumberOfSources()).compactMap { endpoint(MIDIGetSource($0)) }
    }

    func destinations() -> [MidiEndpoint] {
        (0..<MIDIGetNumberOfDestinations()).compactMap { endpoint(MIDIGetDestination($0)) }
    }

    private func endpoint(_ ref: MIDIEndpointRef) -> MidiEndpoint? {
        guard ref != 0 else { return nil }
        var id: Int32 = 0
        MIDIObjectGetIntegerProperty(ref, kMIDIPropertyUniqueID, &id)
        var cfName: Unmanaged<CFString>?
        var name = "Unknown"
        if MIDIObjectGetStringProperty(ref, kMIDIPropertyDisplayName, &cfName) == noErr, let value = cfName?.takeRetainedValue() {
            name = value as String
        }
        return MidiEndpoint(id: id, name: name, ref: ref)
    }

    var isConnected: Bool { source != 0 && destination != 0 }

    func connect(sourceId: Int32, destinationId: Int32) throws {
        try start()
        guard let src = sources().first(where: { $0.id == sourceId }),
              let dst = destinations().first(where: { $0.id == destinationId }) else {
            throw MidiError.endpointNotFound
        }
        disconnect()
        let status = MIDIPortConnectSource(inPort, src.ref, nil)
        guard status == noErr else { throw MidiError.coreMidi("MIDIPortConnectSource", status) }
        source = src.ref
        destination = dst.ref
    }

    func disconnect() {
        if source != 0 { MIDIPortDisconnectSource(inPort, source) }
        source = 0
        destination = 0
        inSysex = false
        sysex.removeAll()
    }

    // MARK: Send

    /// Sends complete MIDI messages in order, sleeping `intervalMs` after each one.
    func send(_ messages: [[UInt8]], intervalMs: Int, completion: @escaping (Error?) -> Void) {
        sendQueue.async { [weak self] in
            guard let self = self else { return }
            do {
                for message in messages {
                    try self.sendNow(message)
                    if intervalMs > 0 { usleep(useconds_t(intervalMs * 1000)) }
                }
                completion(nil)
            } catch {
                completion(error)
            }
        }
    }

    private func sendNow(_ bytes: [UInt8]) throws {
        guard destination != 0 else { throw MidiError.notConnected }
        guard !bytes.isEmpty, bytes.count <= 4096 else {
            throw MidiError.badMessage("A message must be 1 to 4096 bytes")
        }
        let capacity = MemoryLayout<MIDIPacketList>.size + bytes.count + 64
        let raw = UnsafeMutableRawPointer.allocate(byteCount: capacity, alignment: MemoryLayout<MIDIPacketList>.alignment)
        defer { raw.deallocate() }
        let list = raw.bindMemory(to: MIDIPacketList.self, capacity: 1)
        let first = MIDIPacketListInit(list)
        // numericCast: the size parameters are ByteCount, whose Swift type differs between SDKs.
        _ = MIDIPacketListAdd(list, numericCast(capacity), first, 0, numericCast(bytes.count), bytes)
        let status = MIDISend(outPort, destination, list)
        guard status == noErr else { throw MidiError.coreMidi("MIDISend", status) }
    }

    // MARK: Receive

    // MIDIPacketList layout: numPackets (UInt32) at 0, first packet at 4.
    // MIDIPacket layout: timeStamp (UInt64) at 0, length (UInt16) at 8, data at 10.
    // Packets are read through raw offsets because a packet can be longer than the 256-byte
    // `data` field Swift sees, and because packets are not 8-byte aligned.
    private func receive(_ packetList: UnsafePointer<MIDIPacketList>) {
        let count = Int(UnsafeRawPointer(packetList).loadUnaligned(as: UInt32.self))
        var packet = UnsafeRawPointer(packetList).advanced(by: 4)
        for _ in 0..<count {
            let length = Int(packet.loadUnaligned(fromByteOffset: 8, as: UInt16.self))
            let data = UnsafeRawBufferPointer(start: packet.advanced(by: 10), count: length)
            for byte in data { feed(byte) }
            packet = UnsafeRawPointer(MIDIPacketNext(packet.assumingMemoryBound(to: MIDIPacket.self)))
        }
    }

    private func feed(_ byte: UInt8) {
        if byte >= 0xF8 { return }                  // real-time bytes may arrive inside a SysEx
        if byte == 0xF0 {
            inSysex = true
            sysex = [0xF0]
            return
        }
        guard inSysex else { return }               // everything that is not SysEx is ignored
        if byte == 0xF7 {
            sysex.append(byte)
            inSysex = false
            let message = sysex
            sysex = []
            onSysex?(message)
        } else if byte & 0x80 != 0 || sysex.count >= maxSysexLength {
            inSysex = false                         // cut short by another status byte, or runaway
            sysex = []
        } else {
            sysex.append(byte)
        }
    }
}
