import {
  BUFFER_MESSAGE_FORMAT_ERROR,
  shouldCloseStreamRecognize,
  shouldOpenStreamRecognize,
} from './streamRecognizeUtils';

describe('streamRecognizeUtils -', () => {
  describe('method shouldOpenStreamRecognize() - ', () => {
    it('is available', () => {
      expect(shouldOpenStreamRecognize).toBeDefined();
      expect(typeof shouldOpenStreamRecognize).toBe('function');
    });
    it('throws error if bufferMessage is not JSON', () => {
      const testBufferMessage = { shouldStartRecording: true };
      expect(() => shouldOpenStreamRecognize(testBufferMessage)).toThrow(
        BUFFER_MESSAGE_FORMAT_ERROR
      );
    });
    it('return true when message has key - shouldStartRecording with value true', () => {
      const testBufferMessage = JSON.stringify({ shouldStartRecording: true });
      expect(shouldOpenStreamRecognize(testBufferMessage)).toBeTruthy();
    });
    it('return false when message has key - shouldStartRecording with value false', () => {
      const testBufferMessage = JSON.stringify({ shouldStartRecording: false });
      expect(shouldOpenStreamRecognize(testBufferMessage)).toBeFalsy();
    });
  });

  describe('method shouldCloseStreamRecognize() - ', () => {
    it('is available', () => {
      expect(shouldCloseStreamRecognize).toBeDefined();
      expect(typeof shouldCloseStreamRecognize).toBe('function');
    });
    it('throws error if bufferMessage is not JSON', () => {
      const testBufferMessage = { shouldStartRecording: true };
      expect(() => shouldCloseStreamRecognize(testBufferMessage)).toThrow(
        BUFFER_MESSAGE_FORMAT_ERROR
      );
    });
    it('return true when message has key - isRecordingStopped with value true', () => {
      const testBufferMessage = JSON.stringify({ isRecordingStopped: true });
      expect(shouldCloseStreamRecognize(testBufferMessage)).toBeTruthy();
    });
    it('return false when message has key - isRecordingStopped with value false', () => {
      const testBufferMessage = JSON.stringify({ isRecordingStopped: false });
      expect(shouldCloseStreamRecognize(testBufferMessage)).toBeFalsy();
    });
  });
});
