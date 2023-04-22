/* eslint-disable */
/**
 * License (MIT)
 *
 * Copyright © 2013 Matt Diamond
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */
import InlineWorker from 'inline-worker';

const defaultConfig = {
  bufferLen: 4096,
  numChannels: 2,
  mimeType: 'audio/wav',
  sampleRate: 48000,
};

class Microphone {
  config: any;
  recording: boolean;
  callbacks: { getBuffer: never[]; exportWAV: never[] } | any;
  context: any;
  node: any;
  worker: any;
  static forceDownload: (blob: Blob | MediaSource, filename: string) => void;
  onmessage:
    | ((e: {
        data: { command: any; config: any; buffer: any; type: any };
      }) => void)
    | undefined;
  constructor(
    source: { context: any; connect: (arg0: any) => void },
    config: any
  ) {
    this.config = Object.assign({}, defaultConfig, config);

    this.recording = false;

    this.callbacks = {
      getBuffer: [],
      exportWAV: [],
    };

    this.context = source.context;
    this.node = (
      this.context.createScriptProcessor || this.context.createJavaScriptNode
    ).call(
      this.context,
      this.config.bufferLen,
      this.config.numChannels,
      this.config.numChannels
    );

    this.node.onaudioprocess = (e: {
      inputBuffer: { getChannelData: (arg0: number) => any };
    }) => {
      if (!this.recording) return;

      var buffer = [];
      for (var channel = 0; channel < this.config.numChannels; channel++) {
        buffer.push(e.inputBuffer.getChannelData(channel));
      }
      this.worker.postMessage({
        command: 'record',
        buffer: buffer,
      });
    };

    source.connect(this.node);
    this.node.connect(this.context.destination); //this should not be necessary

    let self = {};
    let inlineWorkerFunction = function (thisRef: any) {
      return function (this: any) {
        let recLength = 0,
          recBuffers: never[][] = [],
          sampleRate: number,
          numChannels: number;

        this.onmessage = function (e: {
          data: { command: any; config: any; buffer: any; type: any };
        }) {
          switch (e.data.command) {
            case 'init':
              init(e.data.config);
              break;
            case 'record':
              record(e.data.buffer);
              break;
            case 'exportWAV':
              exportWAV(e.data.type);
              break;
            case 'getBuffer':
              getBuffer();
              break;
            case 'clear':
              clear();
              break;
          }
        };

        function init(config: { sampleRate: any; numChannels: any }) {
          sampleRate = config.sampleRate;
          numChannels = config.numChannels;
          initBuffers();
        }

        function record(inputBuffer: (string | any[])[]) {
          for (var channel = 0; channel < numChannels; channel++) {
            recBuffers[channel].push(inputBuffer[channel] as never);
          }
          recLength += inputBuffer[0].length;
        }

        const exportWAV = (type: any) => {
          let buffers = [];
          for (let channel = 0; channel < numChannels; channel++) {
            buffers.push(mergeBuffers(recBuffers[channel], recLength));
          }
          let interleaved;
          if (numChannels === 2) {
            interleaved = interleave(buffers[0], buffers[1]);
          } else {
            interleaved = buffers[0];
          }
          let dataview = encodeWAV(interleaved);
          let audioBlob = new Blob([dataview], { type: type });

          this.postMessage({ command: 'exportWAV', data: audioBlob });
        };

        function getBuffer(this: any) {
          let buffers = [];
          for (let channel = 0; channel < numChannels; channel++) {
            buffers.push(mergeBuffers(recBuffers[channel], recLength));
          }
          this.postMessage({ command: 'getBuffer', data: buffers });
        }

        function clear() {
          recLength = 0;
          recBuffers = [];
          initBuffers();
        }

        function initBuffers() {
          for (let channel = 0; channel < numChannels; channel++) {
            recBuffers[channel] = [];
          }
        }

        function mergeBuffers(
          recBuffers: string | any[],
          recLength: number | Iterable<number>
        ) {
          let result = new Float32Array(recLength as number);
          let offset = 0;
          for (let i = 0; i < recBuffers.length; i++) {
            result.set(recBuffers[i], offset);
            offset += recBuffers[i].length;
          }
          return result;
        }

        function interleave(
          inputL: string | any[] | Float32Array,
          inputR: string | any[] | Float32Array
        ) {
          let length = inputL.length + inputR.length;
          let result = new Float32Array(length);

          let index = 0,
            inputIndex = 0;

          while (index < length) {
            result[index++] = inputL[inputIndex];
            result[index++] = inputR[inputIndex];
            inputIndex++;
          }
          return result;
        }

        function floatTo16BitPCM(
          output: DataView,
          offset: number,
          input: string | any[]
        ) {
          for (let i = 0; i < input.length; i++, offset += 2) {
            let s = Math.max(-1, Math.min(1, input[i]));
            output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
          }
        }

        function writeString(view: DataView, offset: number, string: string) {
          for (let i = 0; i < string.length; i += 1) {
            view.setUint8(offset + i, string.charCodeAt(i));
          }
        }

        function encodeWAV(samples: string | any[] | Float32Array) {
          const buffer = new ArrayBuffer(44 + samples.length * 2);
          const view = new DataView(buffer);

          /* RIFF identifier */
          writeString(view, 0, 'RIFF');
          /* RIFF chunk length */
          view.setUint32(4, 36 + samples.length * 2, true);
          /* RIFF type */
          writeString(view, 8, 'WAVE');
          /* format chunk identifier */
          writeString(view, 12, 'fmt ');
          /* format chunk length */
          view.setUint32(16, 16, true);
          /* sample format (raw) */
          view.setUint16(20, 1, true);
          /* channel count */
          view.setUint16(22, numChannels, true);
          /* sample rate */
          view.setUint32(24, sampleRate, true);
          /* byte rate (sample rate * block align) */
          view.setUint32(28, sampleRate * 4, true);
          /* block align (channel count * bytes per sample) */
          view.setUint16(32, numChannels * 2, true);
          /* bits per sample */
          view.setUint16(34, 16, true);
          /* data chunk identifier */
          writeString(view, 36, 'data');
          /* data chunk length */
          view.setUint32(40, samples.length * 2, true);

          floatTo16BitPCM(view, 44, samples as string);

          return view;
        }
      };
    };

    this.worker = new InlineWorker(inlineWorkerFunction(this), self);

    this.worker.postMessage({
      command: 'init',
      config: {
        sampleRate: this.context.sampleRate,
        numChannels: this.config.numChannels,
      },
    });

    this.worker.onmessage = (e: {
      data: { command: string | number; data: any };
    }) => {
      const cb = this.callbacks[e.data.command as any].pop();
      if (typeof cb === 'function') {
        cb(e.data.data);
      }
    };
  }
  postMessage(arg0: { command: string; data: Blob }) {
    throw new Error('Method not implemented.');
  }

  record() {
    this.recording = true;
  }

  stop() {
    this.recording = false;
  }

  clear() {
    this.worker.postMessage({ command: 'clear' });
  }

  getBuffer(cb: any) {
    cb = cb || this.config.callback;

    if (!cb) throw new Error('Callback not set');

    this.callbacks.getBuffer.push(cb);

    this.worker.postMessage({ command: 'getBuffer' });
  }

  exportWAV(cb: any, mimeType: any) {
    mimeType = mimeType || this.config.mimeType;
    cb = cb || this.config.callback;

    if (!cb) throw new Error('Callback not set');

    this.callbacks.exportWAV.push(cb);

    this.worker.postMessage({
      command: 'exportWAV',
      type: mimeType,
    });
  }
}

Microphone.forceDownload = function forceDownload(
  blob: Blob | MediaSource,
  filename: string
) {
  const a = document.createElement('a') as HTMLAnchorElement;
  a.style.display = 'none';
  document.body.appendChild(a);

  var url = window.URL.createObjectURL(blob);

  a.href = url;
  a.download = filename;
  a.click();

  window.URL.revokeObjectURL(url);

  document.body.removeChild(a);
};

export default Microphone;
