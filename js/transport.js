// Picks how the app talks to the SEQTRAK.
//   inside the iPad app: the SeqtrakMidi native plugin (CoreMIDI)
//   in a browser:        the simulator, so the screens can be developed and demoed without hardware
import { SimTransport } from './seqtrak/sim.js';

const cap = globalThis.window?.Capacitor;
export const isNative = !!cap?.isNativePlatform?.();

// Device names that mean "this is the SEQTRAK". The docs match on a substring of the port name.
const NAME_MATCH = /seqtrak/i;

// A native call that never answers must not freeze the screen: fail it with a clear message.
function guard(promise, label, ms = 5000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label}: no answer from the MIDI plugin after ${ms / 1000} s`)), ms)),
  ]);
}

class NativeTransport {
  constructor(plugin) {
    this.plugin = plugin;
    this.handlers = new Set();
  }

  async init(onSetupChanged) {
    await guard(this.plugin.addListener('sysex', ev => this.handlers.forEach(h => h(ev.data))), 'listen');
    await guard(this.plugin.addListener('setupChanged', () => onSetupChanged?.()), 'listen');
  }

  onSysex(handler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  send(bytes) {
    return guard(this.plugin.send({ data: Array.from(bytes) }), 'send');
  }

  // Lists MIDI ports and connects to the SEQTRAK if exactly one input and one output match.
  async connect() {
    const { sources, destinations } = await guard(this.plugin.listEndpoints(), 'list ports');
    const ins = sources.filter(e => NAME_MATCH.test(e.name));
    const outs = destinations.filter(e => NAME_MATCH.test(e.name));
    if (ins.length === 0 || outs.length === 0) {
      return { connected: false, sources, destinations, reason: sources.length + destinations.length === 0 ? 'no-midi' : 'no-seqtrak' };
    }
    await guard(this.plugin.connect({ sourceId: ins[0].id, destinationId: outs[0].id }), 'connect');
    return { connected: true, sources, destinations, name: outs[0].name };
  }

  async connectTo(sourceId, destinationId) {
    await guard(this.plugin.connect({ sourceId, destinationId }), 'connect');
  }

  disconnect() {
    return this.plugin.disconnect();
  }
}

class DemoTransport extends SimTransport {
  constructor() {
    super({ latencyMs: 25, dropRate: 0.08 });
  }
  async connect() {
    return { connected: true, sources: [], destinations: [], name: 'Simulated SEQTRAK' };
  }
  async disconnect() {}
}

export async function createTransport(onSetupChanged) {
  if (!isNative) return new DemoTransport();
  const { registerPlugin } = await import('./vendor/capacitor-core.js');
  const transport = new NativeTransport(registerPlugin('SeqtrakMidi'));
  await transport.init(onSetupChanged);
  return transport;
}
