import {BaseHeaders} from './BaseHeaders';

export function AuthenticatedHeader(
  clientId: string,
  appVersion: string,
  bearerToken: string,
  clientType: number = 1,
): Record<string, string> {
  const headers = BaseHeaders(
    clientId,
    appVersion,
    clientType,
  );
  headers['Authorization'] = `Bearer ${bearerToken}`;
  headers['AppVersion'] = appVersion;

  return headers;
}