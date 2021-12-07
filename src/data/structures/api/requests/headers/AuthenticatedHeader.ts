import {BaseHeaders} from './BaseHeaders';

export function AuthenticatedHeader(bearerToken: string) {
  const baseHeaders = BaseHeaders;
  baseHeaders['Authorization'] = `Bearer ${bearerToken}`;
  baseHeaders['Appversion'] = '3.7.0';

  return baseHeaders;
}