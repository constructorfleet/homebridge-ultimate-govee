import {BaseHeaders} from './BaseHeaders';

export function AuthenticatedHeader(
  clientId: string,
  appVersion: string,
  bearerToken: string,
): Record<string, string> {
  const headers = BaseHeaders(
    clientId,
    appVersion,
  );
  headers['Authorization'] = `Bearer ${bearerToken}`;
  headers['Appversion'] = '3.7.0';

  return headers;
}