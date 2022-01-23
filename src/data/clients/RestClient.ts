import {request} from '../request';
import {BaseHeaders} from '../../core/structures/api/requests/headers/BaseHeaders';
import {loginRequest, LoginRequest} from '../../core/structures/api/requests/payloads/LoginRequest';
import {LoginResponse} from '../../core/structures/api/responses/payloads/LoginResponse';
import {AuthenticatedHeader} from '../../core/structures/api/requests/headers/AuthenticatedHeader';
import {BaseRequest} from '../../core/structures/api/requests/payloads/BaseRequest';
import {AppDeviceListResponse} from '../../core/structures/api/responses/payloads/AppDeviceListResponse';
import {GoveeClient} from './GoveeClient';
import {GOVEE_CLIENT_ID} from '../../util/const';
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
import {TokenRefreshRequest, tokenRefreshRequest} from '../../core/structures/api/requests/payloads/TokenRefreshRequest';
import {TokenRefreshResponse} from '../../core/structures/api/responses/payloads/TokenRefreshResponse';
import {PersistService} from '../../persist/PersistService';

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
    private persist: PersistService,
    @Inject(GOVEE_CLIENT_ID) private clientId: string,
  ) {
    super(eventEmitter);
    console.log(this.oauthData);
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

    return (this.oauthData?.refreshToken
      ? this.refreshToken()
      : this.authenticate())
      .then(
        (authData) => {
          this.oauthData = authData;
          const persistedData = this.persist.persistedData;
          persistedData.oauthData = authData;
          this.persist.persistedData = persistedData;
          this.emit(
            new IoTSubscribeToEvent(authData?.accountIoTTopic || ''),
          );
          this.emit(new RestAuthenticatedEvent(authData));
          this.emit(new RestRequestDevices());
          return authData;
        },
      );
  }

  private async authenticate(): Promise<OAuthData> {
    console.log('Authenticating');
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
      .then((res) => {
        console.log(res);
        return res.data.client;
      })
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

  private async refreshToken(): Promise<OAuthData> {
    console.log('REFRESH TOKEN');
    return request<TokenRefreshRequest, TokenRefreshResponse>(
      `${BASE_GOVEE_APP_ACCOUNT_URL}/refresh-tokens`,
      AuthenticatedHeader(this.oauthData?.token || ''),
      tokenRefreshRequest(
        this.oauthData?.token || '',
      ),
    )
      .post()
      .then((res) => {
        return {
          token: res.data.token,
          accountIoTTopic: this.oauthData?.accountIoTTopic,
          refreshToken: res.data.refreshToken,
          tokenExpiration: new ExtendedDate(Date.now()).addHours(
            res.data.tokenExpireCycle)
            .getTime(),
        };
      })
      .then(
        (authData) => {
          this.oauthData = authData;
          const persistedData = this.persist.persistedData;
          persistedData.oauthData = authData;
          this.persist.persistedData = persistedData;
          this.emit(
            new IoTSubscribeToEvent(authData?.accountIoTTopic || ''),
          );
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
