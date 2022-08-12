export function BaseHeaders(
  clientId: string,
  appVersion: string,
): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'clientType': '0',
    'clientId': clientId,
    'appVersion': appVersion,
  };
}
