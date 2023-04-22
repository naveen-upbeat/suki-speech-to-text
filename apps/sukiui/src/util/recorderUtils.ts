import Microphone from './microPhoneUtils';

const defaultConfig = {
  nFrequencyBars: 255,
  onAnalysed: null,
  numChannels: 2,
  sampleRate: 48000,
};

class Recorder {
  config: {
    nFrequencyBars: number;
    onAnalysed: null;
    numChannels?: number;
    sampleRate?: number;
  };
  audioContext: any;
  audioInput: null;
  realAudioInput: null;
  inputPoint: null;
  audioRecorder: null;
  rafID: null;
  analyserContext: null;
  recIndex: number;
  stream: null;
  analyserNode: any;
  static download: (blob: any, filename?: string) => void;
  constructor(audioContext: any, config = {}) {
    this.config = Object.assign({}, defaultConfig, config);

    this.audioContext = audioContext;
    this.audioInput = null;
    this.realAudioInput = null;
    this.inputPoint = null;
    this.audioRecorder = null;
    this.rafID = null;
    this.analyserContext = null;
    this.recIndex = 0;
    this.stream = null;

    this.updateAnalysers = this.updateAnalysers.bind(this);
  }

  init(stream: any) {
    return new Promise<void>((resolve) => {
      this.inputPoint = this.audioContext.createGain() as any;
      const inputPointRef: any = this.inputPoint;

      this.stream = stream;

      this.realAudioInput = this.audioContext.createMediaStreamSource(
        stream
      ) as any;
      this.audioInput = this.realAudioInput as any;
      const audioInputRef: any = this.audioInput as any;
      audioInputRef.connect(this.inputPoint);

      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 2048;
      inputPointRef.connect(this.analyserNode);

      this.audioRecorder = new Microphone(
        this.inputPoint as any,
        this.config
      ) as any;

      const zeroGain = this.audioContext.createGain();
      zeroGain.gain.value = 0.0;

      inputPointRef.connect(zeroGain);
      zeroGain.connect(this.audioContext.destination);

      this.updateAnalysers();

      resolve();
    });
  }

  start() {
    return new Promise((resolve, reject) => {
      if (!this.audioRecorder) {
        reject('Not currently recording');
        return;
      }
      const audioRecorderRef: any = this.audioRecorder as any;
      audioRecorderRef.clear();
      audioRecorderRef.record();

      resolve(this.stream);
    });
  }

  stop() {
    return new Promise((resolve) => {
      const audioRecorderRef: any = this.audioRecorder as any;

      audioRecorderRef.stop();

      audioRecorderRef.getBuffer((buffer: any) => {
        audioRecorderRef.exportWAV((blob: any) => resolve({ buffer, blob }));
      });
    });
  }

  updateAnalysers() {
    if (this.config.onAnalysed) {
      requestAnimationFrame(this.updateAnalysers);

      const freqByteData = new Uint8Array(this.analyserNode.frequencyBinCount);

      this.analyserNode.getByteFrequencyData(freqByteData);

      const data = new Array(255);
      let lastNonZero = 0;
      let datum;

      for (let idx = 0; idx < 255; idx += 1) {
        datum =
          Math.floor(freqByteData[idx]) - (Math.floor(freqByteData[idx]) % 5);

        if (datum !== 0) {
          lastNonZero = idx;
        }

        data[idx] = datum;
      }
      const configRef: any = this.config as any;
      configRef.onAnalysed({ data, lineTo: lastNonZero });
    }
  }

  setOnAnalysed(handler: any) {
    this.config.onAnalysed = handler;
  }
}

Recorder.download = function download(blob: any, filename = 'audio') {
  Microphone.forceDownload(blob, `${filename}.wav`);
};

export default Recorder;
