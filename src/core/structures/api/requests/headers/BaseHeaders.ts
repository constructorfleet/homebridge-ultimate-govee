export function BaseHeaders(
  clientId: string,
  appVersion: string,
): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'clientType': '1',
    'iotVersion': '0',
    'User-Agent': `GoveeHome/${appVersion} (com.ihoment.GoVeeSensor; build:2; iOS 16.5.0) Alamofire/5.6.4`,
    'clientId': clientId,
    'appVersion': appVersion,
  };
}