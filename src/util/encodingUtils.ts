import {decode, encode} from 'base64-arraybuffer';

export const hexStringToArray =
  (hexString: string): number[] =>
    hexString.trim().split(' ')
      .map((x) => parseInt(`0x${x}`));

export const uint8ToHex =
  (uint8Array: Uint8Array): string =>
    Buffer.from(uint8Array)
      .toString('hex')
      .replace(/(.{2})/g, '$1 ');

export const toUint8Array =
  (buffer: ArrayBuffer): Uint8Array =>
    new Uint8Array(buffer);

export const base64ToHex =
  (b64String: string): number[] =>
    hexStringToArray(
      uint8ToHex(
        toUint8Array(
          decode(b64String),
        ),
      ),
    );

export const bufferToHex =
  (buffer: Buffer): number[] =>
    hexStringToArray(
      uint8ToHex(
        toUint8Array(
          buffer,
        ),
      ),
    );

export const hexToBase64 =
  (codes: number[]): string =>
    encode(
      Uint8Array.of(...codes),
    );
