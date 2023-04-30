import { recognizeAsync, recognizeWaveStream } from './sttRequests';
import * as GoogleSpeech from '@google-cloud/speech';

describe('SpeechToText Requests Module -', () => {
  describe('recognizeAsync() method - ', () => {
    const { SpeechClient } = jest.createMockFromModule<
      typeof import('@google-cloud/speech')
    >('@google-cloud/speech');

    it('', () => {
      //   const t2 = jest.spyOn(SpeechClient).mock();``
      const result = recognizeAsync({ content: 'hello' });
      expect(true).toBe(true);
    });
  });

  describe('recognizeWaveStream() method - ', () => {
    it('', () => {
      expect(true).toBeTruthy();
    });
  });
});
