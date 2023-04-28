import {
  getMessageKeyForStreamStart,
  getMessageKeyForStreamStop,
  WEB_SOCKET_BATCH_PATH,
  WEB_SOCKET_STREAM_PATH,
} from './suki-api-configs';

describe('sukiApiConfigs', () => {
  it('has WEB_SOCKET_BATCH_PATH', () => {
    expect(WEB_SOCKET_BATCH_PATH).toBeDefined();
  });
  it('has WEB_SOCKET_STREAM_PATH', () => {
    expect(WEB_SOCKET_STREAM_PATH).toBeDefined();
  });

  describe('has method getMessageKeyForStreamStart', () => {
    it('getMessageKeyForStreamStart - is defined', () => {
      expect(getMessageKeyForStreamStart).toBeDefined();
    });
  });

  describe('has method getMessageKeyForStreamStop', () => {
    it('getMessageKeyForStreamStop - is defined', () => {
      expect(getMessageKeyForStreamStop).toBeDefined();
    });
  });
});
