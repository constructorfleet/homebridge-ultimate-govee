import {request} from '../request';
import {BaseHeaders} from '../structures/api/requests/headers/BaseHeaders';
import {
  loginRequest,
  LoginRequest,
} from '../structures/api/requests/payloads/LoginRequest';
import {LoginResponse} from '../structures/api/requests/payloads/LoginResponse';
import {AuthenticatedHeader} from '../structures/api/requests/headers/AuthenticatedHeader';
import {BaseRequest} from '../structures/api/requests/payloads/base/BaseRequest';
import {
  AppDevice,
  AppDeviceListResponse,
} from '../structures/api/requests/payloads/AppDeviceListResponse';
import {GoveeClient} from './GoveeClient';
import {ApiHeader} from '../structures/api/requests/headers/ApiHeader';
import {
  ApiDevice,
  ApiDeviceListResponse,
} from '../structures/api/requests/payloads/ApiDeviceListResponse';
import {autoInjectable, container, inject} from 'tsyringe';
import {
  DEVICE_SETTINGS_EVENT,
  DEVICE_STATE_EVENT,
  GOVEE_API_KEY,
  GOVEE_CLIENT_ID,
  GOVEE_PASSWORD,
  GOVEE_USERNAME,
  IOT_ACCOUNT_TOPIC,
} from '../../util/const';
import {Emits} from '../../util/events';
import {
  apiDeviceStateRequest,
  ApiDeviceStateRequest,
} from '../structures/api/requests/payloads/ApiDeviceStateRequest';
import {
  ApiDeviceState,
  ApiDeviceStateResponse,
} from '../structures/api/requests/payloads/ApiDeviceStateResponse';
import {flatten} from 'rambda';

const BASE_GOVEE_APP_ACCOUNT_URL = 'https://app.govee.com/account/rest/account/v1';
const BASE_GOVEE_APP_DEVICE_URL = 'https://app2.govee.com/device/rest/devices/v1';
const GOVEE_API_BASE_URL = 'https://developer-api.govee.com/v1/devices';

type DeviceResponse = ApiDevice | AppDevice;

@Emits<RestClient>(
  DEVICE_SETTINGS_EVENT,
  DEVICE_STATE_EVENT,
)
@autoInjectable()
export class RestClient
  extends GoveeClient {
  private token?: string;

  constructor(
    @inject(GOVEE_USERNAME) private username: string,
    @inject(GOVEE_PASSWORD) private password: string,
    @inject(GOVEE_CLIENT_ID) private clientId: string,
    @inject(GOVEE_API_KEY) private apiKey?: string,
  ) {
    super();
  }

  async login(): Promise<RestClient> {
    const response = await request<LoginRequest, LoginResponse>(
      `${BASE_GOVEE_APP_ACCOUNT_URL}/login`,
      BaseHeaders(),
      loginRequest(
        this.username,
        this.password,
        this.clientId,
      ),
    )
      .post();

    this.token = response.data.client.token;
    container.register(
      IOT_ACCOUNT_TOPIC,
      {
        useValue: response.data.client.topic,
      },
    );

    return this;
  }

  async getDevices(): Promise<DeviceResponse[]> {
    return flatten(await Promise.all([
      (async () => await this.getAppDevices())(),
      (async () => await this.getApiDevices())(),
    ]));
  }

  async getAppDevices(): Promise<DeviceResponse[]> {
    const response = await request<BaseRequest, AppDeviceListResponse>(
      `${BASE_GOVEE_APP_DEVICE_URL}/list`,
      AuthenticatedHeader(this.token!),
    )
      .post();

    return response.data.devices;
  }

  async getApiDevices(): Promise<DeviceResponse[]> {
    const response = await request<BaseRequest, ApiDeviceListResponse>(
      GOVEE_API_BASE_URL,
      ApiHeader(this.apiKey!),
      new BaseRequest(),
    )
      .get();

    return response.data.data.devices;
  }

  async getApiDevice(
    deviceId: string,
    model: string,
  ): Promise<ApiDeviceState> {
    const response = await request<ApiDeviceStateRequest, ApiDeviceStateResponse>(
      `${GOVEE_API_BASE_URL}/state`,
      ApiHeader(this.apiKey!),
      apiDeviceStateRequest(
        deviceId,
        model,
      ),
    )
      .get();

    return response.data.data;
  }
}