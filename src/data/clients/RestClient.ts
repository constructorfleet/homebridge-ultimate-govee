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
import {autoInjectable, container, inject, singleton} from 'tsyringe';
import {
  DEVICE_SETTINGS_EVENT,
  DEVICE_STATE_EVENT,
  GOVEE_API_KEY,
  GOVEE_CLIENT_ID,
  GOVEE_PASSWORD,
  GOVEE_USERNAME,
  IOT_ACCOUNT_TOPIC,
  IOT_CONNECTED_EVENT,
  IOT_SUBSCRIBE_EVENT,
} from '../../util/const';
import {Emits, EventHandler, Handles} from '../../core/events';
import {plainToInstance} from 'class-transformer';
import {IoTClient} from './IoTClient';
import {ExtendedDate} from '../../util/extendedDate';

const BASE_GOVEE_APP_ACCOUNT_URL = 'https://app.govee.com/account/rest/account/v1';
const BASE_GOVEE_APP_DEVICE_URL = 'https://app2.govee.com/device/rest/devices/v1';

// const GOVEE_API_BASE_URL = 'https://developer-api.govee.com/v1/devices';

class OAuthTokenData {
  constructor(
    protected token: string,
    protected refreshToken: string,
    private tokenExpirationMinutes: number,
    private timestampIssued: number = ExtendedDate.now(),
  ) {
  }

  as<ResultType>(transform: (authData: OAuthTokenData) => ResultType): ResultType {
    return transform(this);
  }

  get bearerToken(): string {
    return this.token;
  }

  update(
    token: string,
    refreshToken: string,
    expiresInMinutes: number,
  ): this {
    this.token = token;
    this.refreshToken = refreshToken;
    this.tokenExpirationMinutes = expiresInMinutes;
    this.timestampIssued = ExtendedDate.now();

    return this;
  }

  get isValid(): boolean {
    return new ExtendedDate(
      Date.now(),
    )
      .addHours(-this.tokenExpirationMinutes)
      .getTime() < Date.now();
  }
}

@singleton()
@Emits<RestClient>(
  DEVICE_SETTINGS_EVENT,
  DEVICE_STATE_EVENT,
  IOT_SUBSCRIBE_EVENT,
)
@EventHandler()
@autoInjectable()
export class RestClient
  extends GoveeClient {
  private oauthData?: OAuthTokenData;
  private accountTopic?: string;

  constructor(
    @inject(GOVEE_USERNAME) private username: string,
    @inject(GOVEE_PASSWORD) private password: string,
    @inject(GOVEE_CLIENT_ID) private clientId: string,
    @inject(GOVEE_API_KEY) private apiKey?: string,
  ) {
    super();
    console.log('RestClient const');
  }

  @Handles(IOT_CONNECTED_EVENT)
  onIoTConnected = (): void => {
    if (this.accountTopic && !container.isRegistered(IOT_ACCOUNT_TOPIC)) {
      container.register(
        IOT_ACCOUNT_TOPIC,
        {
          useValue: this.accountTopic,
        },
      );
    }

    this.emit(
      IOT_SUBSCRIBE_EVENT,
      container.resolve<IoTClient>(IoTClient),
    );
  };

  async login(): Promise<OAuthTokenData> {
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

    const authData = new OAuthTokenData(
      response.data.client.token,
      response.data.client.refreshToken,
      response.data.client.tokenExpireCycle,
    );

    if (!this.accountTopic && response.data.client.topic) {
      this.accountTopic = response.data.client.topic;
      console.log('SUBSCRIBING TO ACCOUNT');
      container.register(
        IOT_ACCOUNT_TOPIC,
        {
          useValue: this.accountTopic,
        },
      );
      this.emit(
        IOT_SUBSCRIBE_EVENT,
        container.resolve<IoTClient>(IoTClient),
      );
    }

    return authData;
  }

  async getDevices(): Promise<AppDeviceResponse[]> {
    console.log('getDevices');
    await this.login();
    console.log('loggedin');
    const response = await request<BaseRequest, AppDeviceListResponse>(
      `${BASE_GOVEE_APP_DEVICE_URL}/list`,
      AuthenticatedHeader(this.oauthData?.bearerToken || ''),
    )
      .post();

    console.log(response);
    response.data.devices
      .map(
        (resp) => {
          this.emit(
            DEVICE_SETTINGS_EVENT,
            plainToInstance(AppDeviceResponse, resp).deviceExt.deviceSettings,
          );
        },
      );

    return response.data.devices;
  }
}