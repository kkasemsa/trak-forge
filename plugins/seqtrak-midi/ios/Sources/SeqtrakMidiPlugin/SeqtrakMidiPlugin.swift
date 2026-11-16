import Foundation
import Capacitor

/// JavaScript bridge to CoreMIDI. The web side registers it as `SeqtrakMidi`.
///
/// Methods: listEndpoints, connect, disconnect, send, sendMany.
/// Events:  "sysex" { data: [Int] } for every complete SysEx message received,
///          "setupChanged" {} when a MIDI device is plugged in or removed.
@objc(SeqtrakMidiPlugin)
public class SeqtrakMidiPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SeqtrakMidiPlugin"
    public let jsName = "SeqtrakMidi"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "listEndpoints", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "connect", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "disconnect", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "send", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "sendMany", returnType: CAPPluginReturnPromise)
    ]

    private let engine = MidiEngine()

    override public func load() {
        engine.onSysex = { [weak self] bytes in
            self?.notifyListeners("sysex", data: ["data": bytes.map { Int($0) }])
        }
        engine.onSetupChanged = { [weak self] in
            self?.notifyListeners("setupChanged", data: [:])
        }
    }

    @objc func listEndpoints(_ call: CAPPluginCall) {
        do {
            try engine.start()
            call.resolve([
                "sources": engine.sources().map { ["id": Int($0.id), "name": $0.name] },
                "destinations": engine.destinations().map { ["id": Int($0.id), "name": $0.name] },
                "connected": engine.isConnected
            ])
        } catch {
            call.reject(error.localizedDescription)
        }
    }

    @objc func connect(_ call: CAPPluginCall) {
        guard let sourceId = call.getInt("sourceId"), let destinationId = call.getInt("destinationId") else {
            call.reject("sourceId and destinationId are required")
            return
        }
        do {
            try engine.connect(sourceId: Int32(truncatingIfNeeded: sourceId), destinationId: Int32(truncatingIfNeeded: destinationId))
            call.resolve()
        } catch {
            call.reject(error.localizedDescription)
        }
    }

    @objc func disconnect(_ call: CAPPluginCall) {
        engine.disconnect()
        call.resolve()
    }

    @objc func send(_ call: CAPPluginCall) {
        guard let message = bytes(call.getArray("data")) else {
            call.reject("data must be an array of bytes (0-255)")
            return
        }
        engine.send([message], intervalMs: 0) { error in
            if let error = error { call.reject(error.localizedDescription) } else { call.resolve() }
        }
    }

    /// Sends several messages with a fixed pause after each. Not used by the read-only probe;
    /// it is here for the write phases, where a pattern is hundreds of messages paced at 2 ms.
    @objc func sendMany(_ call: CAPPluginCall) {
        guard let rawMessages = call.getArray("messages") else {
            call.reject("messages must be an array of byte arrays")
            return
        }
        var messages: [[UInt8]] = []
        for raw in rawMessages {
            guard let message = bytes(raw as? [Any]) else {
                call.reject("messages must be an array of byte arrays")
                return
            }
            messages.append(message)
        }
        let interval = max(0, min(call.getInt("intervalMs") ?? 2, 1000))
        engine.send(messages, intervalMs: interval) { error in
            if let error = error { call.reject(error.localizedDescription) } else { call.resolve() }
        }
    }

    private func bytes(_ raw: [Any]?) -> [UInt8]? {
        guard let raw = raw, !raw.isEmpty else { return nil }
        var out: [UInt8] = []
        out.reserveCapacity(raw.count)
        for item in raw {
            guard let number = item as? NSNumber else { return nil }
            let value = number.intValue
            guard value >= 0 && value <= 255 else { return nil }
            out.append(UInt8(value))
        }
        return out
    }
}
