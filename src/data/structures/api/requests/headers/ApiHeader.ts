import {BaseHeaders} from './BaseHeaders';

export function ApiHeader(apiKey: string) {
  const baseHeaders = BaseHeaders;
  baseHeaders['Govee-API-Key'] = apiKey;

  return baseHeaders;
}