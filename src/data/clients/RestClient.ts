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
import {inject, singleton} from 'tsyringe';
import {GOVEE_API_KEY, GOVEE_PASSWORD, GOVEE_USERNAME} from '../../util/const';
import {Emits, Handles} from '../../util/events';

const BASE_GOVEE_APP_ACCOUNT_URL = 'https://app.govee.com/account/rest/account/v1';
const BASE_GOVEE_APP_DEVICE_URL = 'https://app2.govee.com/device/rest/devices/v1';
const GOVEE_API_BASE_URL = 'https://developer-api.govee.com/v1/devices';

@singleton()
@Emits<RestClient>('Authenticated')
export class RestClient extends GoveeClient {
  private token?: string;
  private topic?: string;

  constructor(
    @inject(GOVEE_USERNAME) private username: string,
    @inject(GOVEE_PASSWORD) private password: string,
    private clientId: string,
    @inject(GOVEE_API_KEY) private apiKey?: string,
  ) {
    super();
  }

  @Handles('Authenticate')
  async handleAuthentication() {
    await this.login();
  }

  @Handles('retrieveDevices')
  async handleRetrieveDevices() {
    await this.getDevices();
  }

  @Handles('Authenticate')
  async login() {
    const response = await request<BaseHeaders, LoginRequest, LoginResponse>(
      `${BASE_GOVEE_APP_ACCOUNT_URL}/login`,
      new BaseHeaders(),
      LoginRequest.build(
        this.username,
        this.password,
        this.clientId,
      ),
    ).get().catch(err => {
      throw Error(`Unable to authenticate with Govee server. ${err}`);
    });

    if (response?.clientInfo?.bearerToken) {
      throw Error('Unable to retrieve Govee application token.');
    }

    this.token = response.clientInfo.bearerToken;
    this.topic = response.clientInfo.iotAccountTopic;

    this.emit('Authenticated');
  }

  @Handles('RetrieveDevices')
  async getDevices() {
    await Promise.all([
      this.getAppDevices(),
      this.getApiDevices(),
    ]).catch(err => {
      throw Error(err);
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
}