import {
  BUFFER_MESSAGE_FORMAT_ERROR,
  isMessageToSignalStreamClose,
  isMessageToSignalStreamOpen,
  extractTransciptFromRecognizeResponse,
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

  describe('method isMessageToSignalStreamClose() - ', () => {
    it('is available', () => {
      expect(isMessageToSignalStreamClose).toBeDefined();
      expect(typeof isMessageToSignalStreamClose).toBe('function');
    });
    it('throws error if bufferMessage is not JSON', () => {
      const testBufferMessage = { shouldStartRecording: true };
      expect(() => isMessageToSignalStreamClose(testBufferMessage)).toThrow(
        BUFFER_MESSAGE_FORMAT_ERROR
      );
    });
    it('return true when message has key - isRecordingStopped with value true', () => {
      const testBufferMessage = JSON.stringify({ isRecordingStopped: true });
      expect(isMessageToSignalStreamClose(testBufferMessage)).toBeTruthy();
    });
    it('return false when message has key - isRecordingStopped with value false', () => {
      const testBufferMessage = JSON.stringify({ isRecordingStopped: false });
      expect(isMessageToSignalStreamClose(testBufferMessage)).toBeFalsy();
    });
  });

  describe('method extractTransciptFromRecognizeResponse() - ', () => {
    it('is available', () => {
      expect(extractTransciptFromRecognizeResponse).toBeDefined();
      expect(typeof extractTransciptFromRecognizeResponse).toBe('function');
    });
    it('returns empty string for incorrect argument', () => {
      expect(extractTransciptFromRecognizeResponse('')).toBe('');
    });

    it('returns empty string for incorrect response, without results', () => {
      const TRANSCRIPT_TEST1 = 'hello';
      const testRecognizeResponse1 = {
        result2: [
          {
            alternative2: [
              {
                transcript: TRANSCRIPT_TEST1,
              },
            ],
          },
        ],
      };
      expect(
        extractTransciptFromRecognizeResponse(testRecognizeResponse1)
      ).toBe('');
    });

    it('returns empty string for incorrect response, without alternatives', () => {
      const TRANSCRIPT_TEST1 = 'hello';
      const testRecognizeResponse1 = {
        results: [
          {
            alternative2: [
              {
                transcript: TRANSCRIPT_TEST1,
              },
            ],
          },
        ],
      };
      expect(
        extractTransciptFromRecognizeResponse(testRecognizeResponse1)
      ).toBe('');
    });

    it('returns empty string for incorrect response, without transcript', () => {
      const TRANSCRIPT_TEST1 = 'hello';
      const testRecognizeResponse1 = {
        results: [
          {
            alternatives: [
              {
                transcript2: TRANSCRIPT_TEST1,
              },
            ],
          },
        ],
      };
      expect(
        extractTransciptFromRecognizeResponse(testRecognizeResponse1)
      ).toBe('');
    });

    it('returns expected response, without transcript', () => {
      const TRANSCRIPT_TEST1 = 'hello';
      const testRecognizeResponse1 = {
        results: [
          {
            alternatives: [
              {
                transcript2: TRANSCRIPT_TEST1,
              },
              {
                transcript: TRANSCRIPT_TEST1,
              },
            ],
          },
        ],
      };
      expect(
        extractTransciptFromRecognizeResponse(testRecognizeResponse1)
      ).toBe(' ' + TRANSCRIPT_TEST1);
    });

    it('returns expected output for sample response 1', () => {
      const TRANSCRIPT_TEST1 = 'hello';
      const testRecognizeResponse1 = {
        results: [
          {
            alternatives: [
              {
                transcript: TRANSCRIPT_TEST1,
              },
            ],
          },
        ],
      };
      expect(
        extractTransciptFromRecognizeResponse(testRecognizeResponse1)
      ).toBe(TRANSCRIPT_TEST1);
    });

    it('returns expected output for sample response 2', () => {
      const TRANSCRIPT_TEST1 = 'hello';
      const TRANSCRIPT_TEST2 = 'world';
      const testRecognizeResponse1 = {
        results: [
          {
            alternatives: [
              {
                transcript: TRANSCRIPT_TEST1,
              },
              {
                transcript: TRANSCRIPT_TEST2,
              },
            ],
          },
        ],
      };
      expect(
        extractTransciptFromRecognizeResponse(testRecognizeResponse1)
      ).toBe(TRANSCRIPT_TEST1 + ' ' + TRANSCRIPT_TEST2);
    });
  });
});
