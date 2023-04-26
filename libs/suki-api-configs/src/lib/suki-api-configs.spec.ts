import {
  sukiApiConfigs,
  WEB_SOCKET_BATCH_PATH,
  WEB_SOCKET_STREAM_PATH,
} from './suki-api-configs';

describe('sukiApiConfigs', () => {
  it('should work', () => {
    expect(sukiApiConfigs()).toEqual('suki-api-configs');
  });
  it('has WEB_SOCKET_BATCH_PATH', () => {
    expect(WEB_SOCKET_BATCH_PATH).toBeDefined();
  });
  it('has WEB_SOCKET_STREAM_PATH', () => {
    expect(WEB_SOCKET_STREAM_PATH).toBeDefined();
  });
});
