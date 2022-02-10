import {base64ToHex, bufferToHex, hexStringToArray, hexToBase64, uint8ToHex} from './encodingUtils';

describe('encodingUtils', () => {
  describe('hexStringToArray', () => {
    it('returns NaN for non-hexadecimal string', () => {
      expect(hexStringToArray('zz')).toStrictEqual([NaN]);
      expect(hexStringToArray('ab zz')).toStrictEqual([0xab, NaN]);
    });

    it('returns hexadecimal array for hexadecimal string', () => {
      expect(hexStringToArray('ab')).toStrictEqual([0xab]);
      expect(hexStringToArray('ab 00')).toStrictEqual([0xab, 0x00]);
      expect(hexStringToArray('ab 00 ff')).toStrictEqual([0xab, 0x00, 0xff]);
    });
  });

  describe('uint8ToHex', () => {
    it('returns space delimited hexadecimal string', () => {
      expect(uint8ToHex(Uint8Array.of(0))).toStrictEqual('00 ');
      expect(uint8ToHex(Uint8Array.of(0, 10))).toStrictEqual('00 0a ');
      expect(uint8ToHex(Uint8Array.of(0, 10, 200))).toStrictEqual('00 0a c8 ');
    });
  });

  describe('base64ToHex', () => {
    it('returns array of uint8 values from base64 encoded string', () => {
      let expected = [
        0xaa, 0x05, 0x15, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0xba,
      ];
      expect(base64ToHex('qgUVAAAAAAAAAAAAAAAAAAAAALo=')).toStrictEqual(expected);
      expected = [
        0xaa, 0x23, 0xff, 0x00, 0x00,
        0x00, 0x80, 0x00, 0x00, 0x00,
        0x80, 0x00, 0x00, 0x00, 0x80,
        0x00, 0x00, 0x00, 0x80, 0x76,
      ];
      expect(base64ToHex('qiP/AAAAgAAAAIAAAACAAAAAgHY=')).toStrictEqual(expected);
    });
  });

  describe('hexToBase64', () => {
    it('returns base64 encoded string from hexadecimal array', () => {
      let expected = 'qgUVAAAAAAAAAAAAAAAAAAAAALo=';
      expect(hexToBase64([
        0xaa, 0x05, 0x15, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0xba,
      ])).toStrictEqual(expected);
      expected = 'qiP/AAAAgAAAAIAAAACAAAAAgHY=';
      expect(hexToBase64([
        0xaa, 0x23, 0xff, 0x00, 0x00,
        0x00, 0x80, 0x00, 0x00, 0x00,
        0x80, 0x00, 0x00, 0x00, 0x80,
        0x00, 0x00, 0x00, 0x80, 0x76,
      ])).toStrictEqual(expected);
    });
  });

  describe('bufferToHex', () => {
    it('returns array of uint8 values from ArrayBuffer', () => {
      expect(bufferToHex(Buffer.of(0, 10, 200))).toStrictEqual([0, 10, 200]);
    });
  });
});