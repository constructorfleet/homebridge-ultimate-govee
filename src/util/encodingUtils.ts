import {decode} from 'base64-arraybuffer';

const hexStringToArray =
  (hexString: string): string[] =>
    hexString.split(' ');

const uint8ToHex =
  (uint8Array: Uint8Array): string =>
    Buffer.from(uint8Array)
      .toString('hex')
      .replace(/(.{2})/g, '$1 ');

const toUint8Array =
  (buffer: ArrayBuffer): Uint8Array =>
    new Uint8Array(buffer);

export const base64ToHex =
  (...b64Strings: string[]): string[][] =>
    b64Strings
      .map(decode)
      .map(toUint8Array)
      .map(uint8ToHex)
      .map(hexStringToArray);
