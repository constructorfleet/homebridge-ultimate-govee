import {BaseHeaders} from './BaseHeaders';

export function AuthenticatedHeader(bearerToken: string): Record<string, string> {
  const headers = BaseHeaders();
  headers['Authorization'] = `Bearer ${bearerToken}`;
  headers['Appversion'] = '3.7.0';

  return headers;
}