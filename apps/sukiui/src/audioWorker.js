const audioFrameSamples = 128;

function transcode32BitTo16Bit(sample) {
  return Math.floor(sample * 0x7fff);
}

function chunkSizeReached(currentFrameCount, chunkSize) {
  return currentFrameCount === chunkSize;
}

class AudioProcessorForWebAudio extends AudioWorkletProcessor {
  constructor(initOptions) {
    super();
    this.samplesPerFramePerChunk = 12;
    this.sampleFrameCount = 0;
    this.frame = new Int16Array(
      audioFrameSamples * this.samplesPerFramePerChunk
    );
  }

  process(inputs, outputs, parameters) {
    const offset = audioFrameSamples * this.sampleFrameCount;
    inputs[0][0].forEach(
      (sample, idx) =>
        (this.frame[offset + idx] = transcode32BitTo16Bit(sample))
    );
    this.sampleFrameCount = this.sampleFrameCount + 1;

    if (chunkSizeReached(this.sampleFrameCount, this.samplesPerFramePerChunk)) {
      this.port.postMessage(this.frame);
      this.sampleFrameCount = 0;
    }
    
    return true;
  }
}

registerProcessor('audio-pcm-worker', AudioProcessorForWebAudio);
