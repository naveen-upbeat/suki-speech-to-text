import {
  BUFFER_MESSAGE_FORMAT_ERROR,
  isMessageAboutStreamClose,
  isMessageToSignalStreamOpen,
} from './streamRecognizeUtils';

describe('streamRecognizeUtils -', () => {
  describe('method isMessageToSignalStreamOpen() - ', () => {
    it('is available', () => {
      expect(isMessageToSignalStreamOpen).toBeDefined();
      expect(typeof isMessageToSignalStreamOpen).toBe('function');
    });
    it('throws error if bufferMessage is not JSON', () => {
      const testBufferMessage = { shouldStartRecording: true };
      expect(() => isMessageToSignalStreamOpen(testBufferMessage)).toThrow(
        BUFFER_MESSAGE_FORMAT_ERROR
      );
    });
    it('return true when message has key - shouldStartRecording with value true', () => {
      const testBufferMessage = JSON.stringify({ shouldStartRecording: true });
      expect(isMessageToSignalStreamOpen(testBufferMessage)).toBeTruthy();
    });
    it('return false when message has key - shouldStartRecording with value false', () => {
      const testBufferMessage = JSON.stringify({ shouldStartRecording: false });
      expect(isMessageToSignalStreamOpen(testBufferMessage)).toBeFalsy();
    });
  });

  describe('method isMessageAboutStreamClose() - ', () => {
    it('is available', () => {
      expect(isMessageAboutStreamClose).toBeDefined();
      expect(typeof isMessageAboutStreamClose).toBe('function');
    });
    it('throws error if bufferMessage is not JSON', () => {
      const testBufferMessage = { shouldStartRecording: true };
      expect(() => isMessageAboutStreamClose(testBufferMessage)).toThrow(
        BUFFER_MESSAGE_FORMAT_ERROR
      );
    });
    it('return true when message has key - isRecordingStopped with value true', () => {
      const testBufferMessage = JSON.stringify({ isRecordingStopped: true });
      expect(isMessageAboutStreamClose(testBufferMessage)).toBeTruthy();
    });
    it('return false when message has key - isRecordingStopped with value false', () => {
      const testBufferMessage = JSON.stringify({ isRecordingStopped: false });
      expect(isMessageAboutStreamClose(testBufferMessage)).toBeFalsy();
    });
  });
});
