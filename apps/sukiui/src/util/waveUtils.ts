const flattenArray = (
  channelBuffer: string | any[],
  recordingLength: Iterable<number>
) => {
  const result = new Float32Array(recordingLength);
  let offset = 0;
  for (let i = 0; i < channelBuffer.length; i++) {
    const buffer = channelBuffer[i];
    result.set(buffer, offset);
    offset += buffer.length;
  }
  return result;
};
const writeUTFBytes = (view: DataView, offset: number, descriptor: string) => {
  for (let i = 0; i < descriptor.length; i++) {
    view.setUint8(offset + i, descriptor.charCodeAt(i));
  }
};
const interleave = (
  leftChannel: string | any[],
  rightChannel: string | any[]
) => {
  const length = leftChannel.length + rightChannel.length;
  const result = new Float32Array(length);
  let inputIndex = 0;
  for (let index = 0; index < length; ) {
    result[index++] = leftChannel[inputIndex];
    result[index++] = rightChannel[inputIndex];
    inputIndex++;
  }
  return result;
};
const encodeWav = ({ volume, samples, channels, sampleRate }: any) => {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  writeUTFBytes(view, 0, 'RIFF');
  view.setUint32(4, 44 + samples.length * 2, true);
  writeUTFBytes(view, 8, 'WAVE');
  writeUTFBytes(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * (channels * 2), true);
  view.setUint16(32, 4, true);
  view.setUint16(34, 16, true);
  writeUTFBytes(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);
  let index = 44;
  for (let i = 0; i < samples.length; i++) {
    view.setInt16(index, samples[i] * (0x7fff * volume), true);
    index += 2;
  }
  return view;
};

const defaultOptions = {
  volume: 1,
  channels: 1,
  bufferSize: 2048,
  sampleRate: 44100,
};

export { defaultOptions, writeUTFBytes, flattenArray, encodeWav, interleave };
