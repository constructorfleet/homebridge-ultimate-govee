import {BaseHeaders} from './BaseHeaders';

export function ApiHeader(
    clientId: string,
    appVersion: string,
    apiKey: string,
): Record<string, string> {
  const headers = BaseHeaders(
      clientId,
      appVersion,
  );
  headers['Govee-API-Key'] = apiKey;

  return headers;
}
