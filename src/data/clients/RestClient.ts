import {request} from '../request';
import {BaseHeaders} from '../structures/api/requests/headers/BaseHeaders';
import {loginRequest, LoginRequest} from '../structures/api/requests/payloads/LoginRequest';
import {LoginResponse} from '../structures/api/responses/payloads/LoginResponse';
import {AuthenticatedHeader} from '../structures/api/requests/headers/AuthenticatedHeader';
import {BaseRequest} from '../structures/api/requests/payloads/BaseRequest';
import {AppDeviceListResponse} from '../structures/api/responses/payloads/AppDeviceListResponse';
import {GoveeClient} from './GoveeClient';
import {GOVEE_API_KEY, GOVEE_CLIENT_ID, GOVEE_PASSWORD, GOVEE_USERNAME} from '../../util/const';
import {Inject, Injectable} from '@nestjs/common';
import {EventEmitter2, OnEvent} from '@nestjs/event-emitter';
import {OAuthData} from '../../core/structures/AuthenticationData';
import {ConnectionState} from '../../core/events/dataClients/DataClientEvent';
import {ExtendedDate} from '../../util/extendedDate';
import {RestAuthenticatedEvent} from '../../core/events/dataClients/rest/RestAuthentication';
import {IoTSubscribeToEvent} from '../../core/events/dataClients/iot/IotSubscription';
import {RestRequestDevices} from '../../core/events/dataClients/rest/RestRequest';
import {RestResponseDeviceList} from '../../core/events/dataClients/rest/RestResponse';
import {ConfigurationService} from '../../config/ConfigurationService';

const BASE_GOVEE_APP_ACCOUNT_URL = 'https://app.govee.com/account/rest/account/v1';
const BASE_GOVEE_APP_DEVICE_URL = 'https://app2.govee.com/device/rest/devices/v1';

// const GOVEE_API_BASE_URL = 'https://developer-api.govee.com/v1/devices';

@Injectable()
export class RestClient
  extends GoveeClient {
  private oauthData?: OAuthData;

  private get isValidToken(): boolean {
    if (!this.oauthData) {
      return false;
    }
    return this.oauthData.tokenExpiration > Date.now();
  }

  constructor(
    eventEmitter: EventEmitter2,
    private config: ConfigurationService,
    @Inject(GOVEE_CLIENT_ID) private clientId: string,
  ) {
    super(eventEmitter);
  }

  @OnEvent('IOT.Connection')
  onIoTConnected(connection: ConnectionState) {
    if (connection !== ConnectionState.Connected ||
      !this.oauthData?.accountIoTTopic) {
      return;
    }
    this.emit(
      new IoTSubscribeToEvent(this.oauthData?.accountIoTTopic),
    );
  }

  @OnEvent(
    'REST.Authenticate',
    {
      async: true,
    },
  )
  login(): Promise<OAuthData> {
    if (this.isValidToken) {
      return Promise.resolve(this.oauthData!);
    }

    return request<LoginRequest, LoginResponse>(
      `${BASE_GOVEE_APP_ACCOUNT_URL}/login`,
      BaseHeaders(),
      loginRequest(
        this.config.username,
        this.config.password,
        this.clientId,
      ),
    )
      .post()
      .then((res) => res.data.client)
      .then((client): OAuthData => {
        return {
          token: client.token,
          accountIoTTopic: client.topic,
          refreshToken: client.refreshToken,
          tokenExpiration: new ExtendedDate(Date.now()).addHours(
            client.tokenExpireCycle)
            .getTime(),
        };
      })
      .then(
        (authData) => {
          this.oauthData = authData;
          this.emit(
            new IoTSubscribeToEvent(authData?.accountIoTTopic || ''),
          );
          this.emit(new RestAuthenticatedEvent(authData));
          this.emit(new RestRequestDevices());
          return authData;
        },
      );
  }

  @OnEvent(
    'REST.REQUEST.Devices',
    {
      async: true,
    },
  )
  getDevices(): Promise<void> {
    return this.login()
      .then((authData) =>
        request<BaseRequest, AppDeviceListResponse>(
          `${BASE_GOVEE_APP_DEVICE_URL}/list`,
          AuthenticatedHeader(authData.token || ''),
        ),
      )
      .then((req) => req.post())
      .then(
        (resp) =>
          this.emit(
            new RestResponseDeviceList(resp.data),
          ),
      );
  }
}
