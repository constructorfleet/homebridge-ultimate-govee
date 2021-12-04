import {request} from '../request';
import {BaseHeaders} from '../structures/api/requests/headers/baseHeaders';
import {LoginRequest} from '../structures/api/requests/payloads/loginRequest';
import {LoginResponse} from '../structures/api/requests/payloads/loginResponse';
import {AuthenticatedHeader} from '../structures/api/requests/headers/authenticatedHeader';
import {BaseRequest} from '../structures/api/requests/payloads/base/baseRequest';
import {AppDeviceListResponse} from '../structures/api/requests/payloads/appDeviceListResponse';
import {GoveeClient} from './GoveeClient';
import {ApiHeader} from '../structures/api/requests/headers/ApiHeader';
import {ApiDeviceListResponse} from '../structures/api/requests/payloads/apiDeviceListResponse';

const BASE_GOVEE_APP_ACCOUNT_URL = 'https://app.govee.com/account/rest/account/v1';
const BASE_GOVEE_APP_DEVICE_URL = 'https://app2.govee.com/device/rest/devices/v1';
const GOVEE_API_BASE_URL = 'https://developer-api.govee.com/v1/devices';

export class RestClient extends GoveeClient {
  private token?: string;
  private topic?: string;

  constructor(
    private username: string,
    private password: string,
    private clientId: string,
    private apiKey?: string,
  ) {
    super();
  }

  async login() {
    await request<BaseHeaders, LoginRequest, LoginResponse>(
      `${BASE_GOVEE_APP_ACCOUNT_URL}/login`,
      new BaseHeaders(),
      LoginRequest.build(
        this.username,
        this.password,
        this.clientId,
      ),
    ).get().then(response => {
      if (response?.clientInfo?.bearerToken) {
        Promise.reject('Unable to retrieve Govee application token.');
      }

      this.token = response.clientInfo.bearerToken;
      this.topic = response.clientInfo.iotAccountTopic;
    }).catch(err => {
      throw Error(`Unable to authenticate with Govee server. ${err}`);
    });
  }

  async getAppDevices() {
    await request<AuthenticatedHeader, BaseRequest, AppDeviceListResponse>(
      `${BASE_GOVEE_APP_DEVICE_URL}/list`,
      AuthenticatedHeader.build(this.token!),
      BaseRequest.build(),
    ).get().then(response => {

    }).catch(err => {
      throw Error(`Unable to retrieve Govee device list. ${err}`);
    });
  }

  async getApiDevices() {
    await request<ApiHeader, BaseRequest, ApiDeviceListResponse>(
      `${GOVEE_API_BASE_URL}`,
      ApiHeader.build(this.apiKey!),
      BaseRequest.build(),
    ).get().then(response => {

    }).catch(err => {
      throw Error(`Unable to retrieve Govee api device list. ${err}`);
    });
  }

  //
  // curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7InNpZCI6IjRsNnZFY3I5cVNXamlYaVBNRUVtSGRwT1pCdXRkcmxwIn0sImlhdCI6MTYzNzkwODE3OCwiZXhwIjoxNjQzMDkyMTc4fQ.jCfgJIodT0foFbFWr_Owzn6l84nzqLM9DGvRMkwNNyY" -H "AppVersion: 3.7.0" -H "Content-Type: application/json" -d '{"device": "25:DA:9C:04:A0:49:CF:55", "sku": "H7141", "waterShortageOnOff": 0}' -XPOST https://app2.govee.com/account/rest/account/v1/iot
  //
  //
  //   async getDevices(): {
  //
  // }
  //
  // async getDevices(): Promise<GoveeDeviceProperties[]> {
  //   if (!this.token) {
  //     throw Error(
  //       'Cannot get structures when Govee client is not authenticated.');
  //   }
  //
  //   const [appDevices, apiDevices] = await Promise.all([
  //     this.getAppDevices(),
  //     this.getApiDevices(),
  //   ]);
  //
  //   const deviceMap = appDevices.concat(...apiDevices).reduce(
  //     (
  //       result,
  //       device,
  //     ) => {
  //       result[device.device] = Object.assign(
  //         result[device.device] || {},
  //         device,
  //       );
  //       return result;
  //     },
  //     new Map<string, GoveeDeviceProperties>(),
  //   );
  //
  //   return await Promise.all(
  //     Array.from(
  //       deviceMap,
  //       ([, value]) => value,
  //     ).map(this.getDeviceState),
  //   );
  // }
  //
  // private async getAppDevices(): Promise<GoveeDeviceProperties[]> {
  //   const response = await axios(
  //     GOVEE_APP_DEVICE_LIST_URL,
  //     {
  //       method: 'POST',
  //       timeout: 10000,
  //       headers: {
  //         Authorization: `Bearer ${this.token}`,
  //         AppVersion: '3.7.0',
  //       },
  //     },
  //   );
  //
  //   if (!response?.data?.devices) {
  //     throw Error('Unable to retrieve Govee app structures');
  //   }
  //
  //   return response.data.devices.map(
  //     device => device?.deviceExt?.deviceSettings).
  //     filter(deviceSettings => !!deviceSettings).
  //     map(JSON.parse).
  //     map(curry(plainToInstance)(GoveeDeviceProperties));
  // }
  //
  // private async getApiDevices(): Promise<GoveeDeviceProperties[]> {
  //   if (!this.apiKey) {
  //     return [];
  //   }
  //
  //   const response = await axios(
  //     `${GOVEE_API_BASE_URL}`,
  //     {
  //       method: 'GET',
  //       timeout: 10000,
  //       headers: {
  //         'Govee-API-Key': this.apiKey,
  //       },
  //     },
  //   );
  //
  //   if (!response?.data?.devices) {
  //     throw Error('Unable to retrieve Govee api structures.');
  //   }
  //
  //   return response.data.devices.map(
  //     curry(plainToInstance)(GoveeDeviceProperties));
  // }
  //
  // async getDeviceState(
  //   device: GoveeDeviceProperties,
  // ): Promise<GoveeDeviceProperties> {
  //   if (!this.apiKey) {
  //     return device;
  //   }
  //
  //   const response = await axios(
  //     `${GOVEE_API_BASE_URL}/state`,
  //     {
  //       method: 'GET',
  //       timeout: 10000,
  //       headers: {
  //         'Govee-API-Key': this.apiKey,
  //       },
  //       params: {
  //         device: device.device,
  //         model: device.sku,
  //       },
  //     },
  //   );
  //
  //   if (!response?.data?.data?.properties) {
  //     throw Error(`Unable to retrieve state for device ${device.device}`);
  //   }
  //
  //   response.data.data.properties.map(curry(Object.assign)(device.state));
  //
  //   return device;
  // }
}