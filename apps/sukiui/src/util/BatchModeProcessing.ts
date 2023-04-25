type InputQueueCallbackProps = {
  inputQueue: Blob[];
  outputQueue: string[];
};

class BatchModeProcessing {
  inputQueue: Blob[] = [];
  outputQueue: string[] = [];

  onAddInputQueueCallback = function ({
    inputQueue,
    outputQueue,
  }: InputQueueCallbackProps) {
    return;
  };

  onAddOutputQueueCallback = function ({
    inputQueue,
    outputQueue,
  }: InputQueueCallbackProps) {
    return;
  };

  processInputQueue(cb: any) {
    cb.call(this, {
      inputQueue: this.inputQueue,
      outputQueue: this.outputQueue,
    });
  }

  setCallbackForAddInput(
    cb: ({ inputQueue, outputQueue }: InputQueueCallbackProps) => void
  ) {
    this.onAddInputQueueCallback = cb.bind(this);
  }

  getInputQueue() {
    return this.inputQueue;
  }

  addInput(newWaveBlob: Blob) {
    this.inputQueue.push(newWaveBlob);

    this.onAddInputQueueCallback.call(this, {
      inputQueue: this.inputQueue,
      outputQueue: this.outputQueue,
    });
  }

  getOutputQueue() {
    return this.outputQueue;
  }

  setCallbackForAddOutput(
    cb: ({ inputQueue, outputQueue }: InputQueueCallbackProps) => void
  ) {
    this.onAddOutputQueueCallback = cb.bind(this);
  }

  insertToOutput(transcript: string) {
    this.outputQueue.push(transcript);

    this.onAddOutputQueueCallback.call(this, {
      inputQueue: this.inputQueue,
      outputQueue: this.outputQueue,
    });
  }

  clearQueues() {
    this.inputQueue = [];
    this.outputQueue = [];
  }
}

export default BatchModeProcessing;
