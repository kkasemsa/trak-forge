// SEQTRAK SysEx framing. Source: jaeggerr/seqtrak-docs, docs/02-sysex-format.md.
//
//   Parameter Change    F0 43 1n 7F 1C 0C ah am al dd ... F7
//   Parameter Request   F0 43 3n 7F 1C 0C ah am al F7
//
// A Parameter Request is answered with a Parameter Change at the same address.
// Every byte between F0 and F7 is 7-bit.

export const YAMAHA = 0x43;
export const GROUP_HI = 0x7f;
export const GROUP_LO = 0x1c;
export const MODEL = 0x0c;

const KIND_CHANGE = 0x10;
const KIND_REQUEST = 0x30;

function checkAddress(addr) {
  if (!Array.isArray(addr) || addr.length !== 3) throw new Error('address must be [ah, am, al]');
  for (const b of addr) check7(b);
}

function check7(b) {
  if (!Number.isInteger(b) || b < 0 || b > 0x7f) throw new Error(`not a 7-bit value: ${b}`);
}

export function paramRequest(addr) {
  checkAddress(addr);
  return [0xf0, YAMAHA, KIND_REQUEST, GROUP_HI, GROUP_LO, MODEL, ...addr, 0xf7];
}

// Phase 1 is read-only and never calls this. It exists so the mock device and the tests can
// build replies, and so the write phases have one audited place that produces a write frame.
export function paramChange(addr, data = []) {
  checkAddress(addr);
  data.forEach(check7);
  return [0xf0, YAMAHA, KIND_CHANGE, GROUP_HI, GROUP_LO, MODEL, ...addr, ...data, 0xf7];
}

// Parses one complete SysEx message. Returns null for anything that is not a SEQTRAK
// Parameter Change or Parameter Request (bulk dumps included: they use different offsets).
export function parse(bytes) {
  if (!bytes || bytes.length < 10) return null;
  if (bytes[0] !== 0xf0 || bytes[bytes.length - 1] !== 0xf7) return null;
  if (bytes[1] !== YAMAHA || bytes[3] !== GROUP_HI || bytes[4] !== GROUP_LO || bytes[5] !== MODEL) return null;
  // The device number is the low nibble of byte 2; the device answers on any, so mask it.
  const kindByte = bytes[2] & 0xf0;
  const kind = kindByte === KIND_CHANGE ? 'change' : kindByte === KIND_REQUEST ? 'request' : null;
  if (!kind) return null;
  return {
    kind,
    addr: [bytes[6], bytes[7], bytes[8]],
    data: Array.from(bytes.slice(9, bytes.length - 1)),
  };
}

export const sameAddress = (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];

// 14-bit values travel MSB first: bits 13-7, then bits 6-0.
export const from14 = (msb, lsb) => ((msb & 0x7f) << 7) | (lsb & 0x7f);
export const to14 = v => [(v >> 7) & 0x7f, v & 0x7f];

export const hex = bytes => Array.from(bytes, b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
