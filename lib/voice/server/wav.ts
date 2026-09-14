/** Minimal WAV helpers (no dependencies) for durations and silent placeholders. */

export function wavDurationMs(bytes: Uint8Array): number {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length < 44 || dv.getUint32(0, false) !== 0x52494646 /* RIFF */) return 0;
  let byteRate = 0;
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const id = dv.getUint32(offset, false);
    const size = dv.getUint32(offset + 4, true);
    if (id === 0x666d7420 /* fmt  */) byteRate = dv.getUint32(offset + 16, true);
    if (id === 0x64617461 /* data */) {
      const dataSize = size === 0xffffffff || offset + 8 + size > bytes.length ? bytes.length - offset - 8 : size;
      return byteRate ? Math.round((dataSize / byteRate) * 1000) : 0;
    }
    offset += 8 + size + (size % 2);
  }
  return 0;
}

export function silentWav(durationMs: number, sampleRate = 16000): Uint8Array {
  const samples = Math.round((durationMs / 1000) * sampleRate);
  const dataSize = samples * 2;
  const buf = new ArrayBuffer(44 + dataSize);
  const dv = new DataView(buf);
  const str = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i));
  };
  str(0, "RIFF");
  dv.setUint32(4, 36 + dataSize, true);
  str(8, "WAVE");
  str(12, "fmt ");
  dv.setUint32(16, 16, true);
  dv.setUint16(20, 1, true); // PCM
  dv.setUint16(22, 1, true); // mono
  dv.setUint32(24, sampleRate, true);
  dv.setUint32(28, sampleRate * 2, true);
  dv.setUint16(32, 2, true);
  dv.setUint16(34, 16, true);
  str(36, "data");
  dv.setUint32(40, dataSize, true);
  return new Uint8Array(buf);
}
