import {BaseHeaders} from './BaseHeaders';

export function ApiHeader(apiKey: string): Record<string, string> {
  const headers = BaseHeaders();
  headers['Govee-API-Key'] = apiKey;

  return headers;
}