const BASE64_REGEX = /^([\da-zA-Z+/]{4})*(([\da-zA-Z+/]{2}==)|([\da-zA-Z+/]{3}=))?$/;
export const DIVIDER_TOKEN = ':';

export const isBase64 = (testString: string): boolean =>
    BASE64_REGEX.test(testString);

export const debase = (encoded: string): string =>
    isBase64(encoded)
        ? Buffer.from(
            encoded,
            'base64',
        )
            .toString()
        : encoded;

export const base = (toEncode: string): string =>
    isBase64(toEncode)
        ? toEncode
        : Buffer.from(toEncode)
            .toString('base64');

export const fromId = (id: string) => debase(id)
    .split(DIVIDER_TOKEN);

export const toId = (
    type: string,
    id: string,
) =>
    base([
      type,
      id,
    ].join(DIVIDER_TOKEN));

export type GetTypenameFromId = (id: string) => string | undefined;

export const getTypenameFromId: GetTypenameFromId = (id) => fromId(id)?.[0];
