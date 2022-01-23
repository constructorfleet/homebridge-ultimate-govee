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

  private get isValidToken(): boolean {
    return (this.persist.oauthData?.tokenExpiration || 0) > Date.now();
  }

  constructor(
    eventEmitter: EventEmitter2,
    private config: ConfigurationService,
    private persist: PersistService,
    @Inject(GOVEE_CLIENT_ID) private clientId: string,
  ) {
    super(eventEmitter);
  }

  @OnEvent('IOT.Connection')
  onIoTConnected(connection: ConnectionState) {
    const accountTopic = this.persist.oauthData?.accountIoTTopic;
    if (connection !== ConnectionState.Connected ||
      !accountTopic) {
      return;
    }
    this.emit(
      new IoTSubscribeToEvent(accountTopic),
    );
  }

  @OnEvent(
    'REST.Authenticate',
    {
      async: true,
    },
  )
  login(requestDevices: boolean = false): Promise<OAuthData> {
    if (this.isValidToken) {
      const oauthData = this.persist.oauthData!;
      this.emit(
        new IoTSubscribeToEvent(oauthData.accountIoTTopic || ''),
      );
      if (requestDevices) {
        this.emit(new RestAuthenticatedEvent(oauthData));
        this.emit(new RestRequestDevices());
      }
      return Promise.resolve(oauthData);
    }

    return (this.persist.oauthData?.refreshToken
      ? this.refreshToken()
      : this.authenticate())
      .then(
        (authData) => {
          this.emit(
            new IoTSubscribeToEvent(authData?.accountIoTTopic || ''),
          );
          if (requestDevices) {
            this.emit(new RestAuthenticatedEvent(authData));
            this.emit(new RestRequestDevices());
          }
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
          this.persist.oauthData = authData;
          return authData;
        },
      );
  }

  private async refreshToken(): Promise<OAuthData> {
    console.log('REFRESH TOKEN');
    return request<TokenRefreshRequest, TokenRefreshResponse>(
      `${BASE_GOVEE_APP_ACCOUNT_URL}/refresh-tokens`,
      AuthenticatedHeader(this.persist.oauthData?.token || ''),
      tokenRefreshRequest(
        this.persist.oauthData?.token || '',
      ),
    )
      .post()
      .then((res) => {
        return {
          token: res.data.token,
          accountIoTTopic: this.persist.oauthData?.accountIoTTopic,
          refreshToken: res.data.refreshToken,
          tokenExpiration: new ExtendedDate(Date.now()).addHours(
            res.data.tokenExpireCycle)
            .getTime(),
        };
      })
      .then(
        (authData) => {
          this.persist.oauthData = authData;
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
    return this.login(false)
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
