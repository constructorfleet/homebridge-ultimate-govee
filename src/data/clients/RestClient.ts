import {request} from '../request';
import {BaseHeaders} from '../structures/api/requests/headers/BaseHeaders';
import {
  loginRequest,
  LoginRequest,
} from '../structures/api/requests/payloads/LoginRequest';
import {LoginResponse} from '../structures/api/requests/payloads/LoginResponse';
import {AuthenticatedHeader} from '../structures/api/requests/headers/AuthenticatedHeader';
import {BaseRequest} from '../structures/api/requests/payloads/base/BaseRequest';
import {AppDeviceListResponse} from '../structures/api/requests/payloads/AppDeviceListResponse';
import {GoveeClient} from './GoveeClient';
import {ApiHeader} from '../structures/api/requests/headers/ApiHeader';
import {ApiDeviceListResponse} from '../structures/api/requests/payloads/ApiDeviceListResponse';
import {autoInjectable, container, inject} from 'tsyringe';
import {
  GOVEE_API_KEY,
  GOVEE_CLIENT_ID,
  GOVEE_PASSWORD,
  GOVEE_USERNAME,
  IOT_ACCOUNT_TOPIC,
} from '../../util/const';
import {Emits} from '../../util/events';
import {GoveeDevice} from '../../devices/GoveeDevice';

const BASE_GOVEE_APP_ACCOUNT_URL = 'https://app.govee.com/account/rest/account/v1';
const BASE_GOVEE_APP_DEVICE_URL = 'https://app2.govee.com/device/rest/devices/v1';
const GOVEE_API_BASE_URL = 'https://developer-api.govee.com/v1/devices';

@Emits<RestClient>(
  'DeviceSettings',
  'DeviceState',
)
@autoInjectable()
export class RestClient extends GoveeClient {
  private token?: string;

  constructor(
    @inject(GOVEE_USERNAME) private username: string,
    @inject(GOVEE_PASSWORD) private password: string,
    @inject(GOVEE_CLIENT_ID) private clientId: string,
    @inject(GOVEE_API_KEY) private apiKey?: string,
  ) {
    super();
    console.log('Constructing');
  }

  async login(): Promise<RestClient> {
    return await request<LoginRequest, LoginResponse>(
      `${BASE_GOVEE_APP_ACCOUNT_URL}/login`,
      BaseHeaders,
      loginRequest(
        this.username,
        this.password,
        this.clientId,
      ),
    ).post().then((response: LoginResponse) => {
      this.token = response.client.token;
      container.register(
        IOT_ACCOUNT_TOPIC,
        {
          useValue: response.client.topic,
        },
      );

      return this;
    });
  }

  async getDevices(): Promise<RestClient> {
    return await Promise.all([
      this.getAppDevices(),
      this.getApiDevices(),
    ]).then(([appDevices, apiDevices]) => {
      return this;
    });
  }

  async getAppDevices(): Promise<GoveeDevice[] | void> {
    return await request<BaseRequest, AppDeviceListResponse>(
      `${BASE_GOVEE_APP_DEVICE_URL}/list`,
      AuthenticatedHeader(this.token!),
    ).post().then((response) => {
        console.log(response);
        return response.devices.map(
          (device) => new GoveeDevice(
            device.deviceName,
            device.device,
            device.sku,
          ),
        );
      },
      (err) => console.log(err),
    );
  }

  async getApiDevices(): Promise<GoveeDevice[] | void> {
    return await request<BaseRequest, ApiDeviceListResponse>(
      `${GOVEE_API_BASE_URL}`,
      ApiHeader(this.apiKey!),
      new BaseRequest(),
    ).get().then((response) => {
        console.log(response);
        return response.data.devices.map(
          (device) => new GoveeDevice(
            device.deviceName,
            device.device,
            device.model,
          ),
        );
      }, (err) => {
        console.log(err);
      },
    );
  }
}