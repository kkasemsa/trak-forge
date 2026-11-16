// Request/reply link to a SEQTRAK over any transport that can send and receive SysEx.
//
// A transport is { send(bytes): Promise, onSysex(handler): unsubscribe }.
//
// Rules taken from the hardware notes in seqtrak-docs (07-transports, 10-verified-behaviour):
//   - pace every message at 2 ms, which is what Yamaha's own app does
//   - an isolated Parameter Request is lost about 1 time in 10, so a missing reply means
//     nothing: retry, and only then report "no reply"
//   - a reply with zero data bytes is a real answer ("empty"), not a failure
//   - a round trip takes about 250 ms over USB
import { paramRequest, parse, sameAddress, hex } from './sysex.js';

export const IDENTITY_REQUEST = [0xf0, 0x7e, 0x7f, 0x06, 0x01, 0xf7];
const isIdentityReply = b => b.length >= 12 && b[0] === 0xf0 && b[1] === 0x7e && b[3] === 0x06 && b[4] === 0x02;

const sleep = ms => new Promise(r => setTimeout(r, ms));

export class Link {
  constructor(transport, { paceMs = 2, timeoutMs = 700, attempts = 4, log = null } = {}) {
    this.transport = transport;
    this.paceMs = paceMs;
    this.timeoutMs = timeoutMs;
    this.attempts = attempts;
    this.log = log;
    this.pending = null;
    this.pendingIdentity = null;
    this.queue = Promise.resolve();
    this.stats = { requests: 0, replies: 0, retries: 0, failures: 0 };
    this.unsubscribe = transport.onSysex(bytes => this.receive(bytes));
  }

  close() {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  receive(bytes) {
    this.log?.('in', bytes);
    if (this.pendingIdentity && isIdentityReply(bytes)) {
      const { resolve } = this.pendingIdentity;
      this.pendingIdentity = null;
      resolve(Array.from(bytes));
      return;
    }
    const msg = parse(bytes);
    if (!msg || msg.kind !== 'change' || !this.pending) return;
    if (!sameAddress(msg.addr, this.pending.addr)) return;
    const { resolve } = this.pending;
    this.pending = null;
    resolve(msg.data);
  }

  // Reads one address. Resolves { ok: true, data } or { ok: false } after every attempt timed out.
  // Reads are serialised: one request on the wire at a time, so replies cannot be confused.
  read(addr) {
    const run = () => this.readNow(addr);
    const result = this.queue.then(run, run);
    this.queue = result.catch(() => {});
    return result;
  }

  // Universal Identity Request. Changes nothing on the device; the cheapest "is it there" check.
  //   -> F0 7E 7F 06 01 F7
  //   <- F0 7E 7F 06 02 43 00 41 64 06 mm 00 00 7F F7     OS version = 1.0 + mm / 10
  identity() {
    const run = () => this.identityNow();
    const result = this.queue.then(run, run);
    this.queue = result.catch(() => {});
    return result;
  }

  async identityNow() {
    for (let attempt = 0; attempt < this.attempts; attempt++) {
      if (attempt > 0) this.stats.retries++;
      this.stats.requests++;
      const reply = new Promise(resolve => { this.pendingIdentity = { resolve }; });
      this.log?.('out', IDENTITY_REQUEST);
      await this.transport.send(IDENTITY_REQUEST);
      await sleep(this.paceMs);
      const bytes = await Promise.race([reply, sleep(this.timeoutMs).then(() => null)]);
      this.pendingIdentity = null;
      if (bytes) {
        this.stats.replies++;
        const isSeqtrak = bytes[5] === 0x43 && bytes[7] === 0x41 && bytes[8] === 0x64 && bytes[9] === 0x06;
        return { ok: true, isSeqtrak, osVersion: isSeqtrak ? (10 + bytes[10]) / 10 : null, bytes };
      }
    }
    this.stats.failures++;
    return { ok: false };
  }

  async readNow(addr) {
    for (let attempt = 0; attempt < this.attempts; attempt++) {
      if (attempt > 0) this.stats.retries++;
      this.stats.requests++;
      const reply = new Promise(resolve => { this.pending = { addr, resolve }; });
      const frame = paramRequest(addr);
      this.log?.('out', frame);
      await this.transport.send(frame);
      await sleep(this.paceMs);
      const data = await Promise.race([reply, sleep(this.timeoutMs).then(() => null)]);
      this.pending = null;
      if (data) {
        this.stats.replies++;
        return { ok: true, data };
      }
    }
    this.stats.failures++;
    return { ok: false, data: null };
  }
}

export const describeFrame = bytes => hex(bytes);
