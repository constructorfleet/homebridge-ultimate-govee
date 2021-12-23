import {request} from '../request';
import {BaseHeaders} from '../structures/api/requests/headers/BaseHeaders';
import {
  loginRequest,
  LoginRequest,
} from '../structures/api/requests/payloads/LoginRequest';
import {LoginResponse} from '../structures/api/responses/payloads/LoginResponse';
import {AuthenticatedHeader} from '../structures/api/requests/headers/AuthenticatedHeader';
import {BaseRequest} from '../structures/api/requests/payloads/BaseRequest';
import {
  AppDeviceListResponse,
  AppDeviceResponse,
} from '../structures/api/responses/payloads/AppDeviceListResponse';
import {GoveeClient} from './GoveeClient';
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
import {plainToInstance} from 'class-transformer';

const BASE_GOVEE_APP_ACCOUNT_URL = 'https://app.govee.com/account/rest/account/v1';
const BASE_GOVEE_APP_DEVICE_URL = 'https://app2.govee.com/device/rest/devices/v1';

// const GOVEE_API_BASE_URL = 'https://developer-api.govee.com/v1/devices';

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

  async login(): Promise<this> {
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

  async getDevices(): Promise<AppDeviceResponse[]> {
    const response = await request<BaseRequest, AppDeviceListResponse>(
      `${BASE_GOVEE_APP_DEVICE_URL}/list`,
      AuthenticatedHeader(this.token!),
    )
      .post();

    response.data.devices
      .map(
        (resp) => this.emit(
          DEVICE_SETTINGS_EVENT,
          plainToInstance(AppDeviceResponse, resp).deviceExt.deviceSettings,
        ),
      );

    return response.data.devices;
  }
}