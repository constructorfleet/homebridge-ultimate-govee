import {getCommandCodes, getCommandValues} from './opCodeUtils';

describe('opCodeUtils', () => {
  describe('getCommandCodes', () => {
    it('returns an array of length 20', () => {
      expect(getCommandCodes(10, [5, 1], 5)).toHaveLength(20);
    });
    it('returns the XOR as the last element', () => {
      const expected = 0 ^ 10 ^ 5 ^ 2;
      expect(getCommandCodes(10, [5], 2)).toStrictEqual(
        [
          10, 5, 2, 0, 0,
          0, 0, 0, 0, 0,
          0, 0, 0, 0, 0,
          0, 0, 0, 0, expected,
        ],
      );
    });
  });

  describe('getCommandValues', () => {
    it('returns values for appropriate identifier', () => {
      const identifier = [5, 2];
      const commands = [
        [1, 0, 10],
        [10, 1, 1],
        [5, 2, 10, 25],
      ];
      expect(getCommandValues(
        identifier,
        commands,
      )).toStrictEqual([[10, 25]]);
    });
  });
});
