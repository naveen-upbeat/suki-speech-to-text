import { displayFlexRow } from './styleUtils';

describe('Utils - StyleUtils', () => {
  describe('- displayFlexRow', () => {
    it('is available', () => {
      expect(displayFlexRow).toBeDefined();
    });
    it('has display flex', () => {
      expect(displayFlexRow.display).toBe('flex');
      expect(displayFlexRow.flexDirection).toBe('row');
    });
  });
});
