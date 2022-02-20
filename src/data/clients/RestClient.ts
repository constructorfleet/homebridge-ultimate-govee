import {request} from '../request';
import {BaseHeaders} from '../../core/structures/api/requests/headers/BaseHeaders';
import {loginRequest, LoginRequest} from '../../core/structures/api/requests/payloads/LoginRequest';
import {LoginResponse} from '../../core/structures/api/responses/payloads/LoginResponse';
import {GoveeClient} from './GoveeClient';
import {Inject, Injectable} from '@nestjs/common';
import {EventEmitter2, OnEvent} from '@nestjs/event-emitter';
import {OAuthData} from '../../core/structures/AuthenticationData';
import {RestAuthenticatedEvent, RestAuthenticationFailureEvent} from '../../core/events/dataClients/rest/RestAuthentication';
import {IoTSubscribeToEvent} from '../../core/events/dataClients/iot/IotSubscription';
import {RestRequestDevices, RestRequestDIYEffects} from '../../core/events/dataClients/rest/RestRequest';
import {ConfigurationService} from '../../config/ConfigurationService';
import {PersistService} from '../../persist/PersistService';
import {LoggingService} from '../../logging/LoggingService';
import {ApiError} from '../../core/structures/api/ApiResponseStatus';
import jwtDecode from 'jwt-decode';
import {JWTPayload} from '../../core/structures/api/JsonWebToken';
import {BaseRequest} from '../../core/structures/api/requests/payloads/BaseRequest';
import {AppDeviceListResponse} from '../../core/structures/api/responses/payloads/AppDeviceListResponse';
import {AuthenticatedHeader} from '../../core/structures/api/requests/headers/AuthenticatedHeader';
import {RestDeviceScenesResponse, RestDIYEffectResponse, RestResponseDeviceList} from '../../core/events/dataClients/rest/RestResponse';
import {GOVEE_CLIENT_ID} from '../../util/const';
import {DIYListResponse} from '../../core/structures/api/responses/payloads/DIYListResponse';
import {GoveeDevice} from '../../devices/GoveeDevice';
import {DeviceSceneRequest, deviceSceneRequest} from '../../core/structures/api/requests/payloads/DeviceSceneRequest';
import {DeviceSceneListResponse} from '../../core/structures/api/responses/payloads/DeviceSceneListResponse';

const GOVEE_APP_VERSION = '3.7.0';
const BASE_GOVEE_APP_URL = 'https://app2.govee.com';
const BASE_GOVEE_APP_ACCOUNT_URL = `${BASE_GOVEE_APP_URL}/account/rest/account/v1`;
const BASE_GOVEE_APP_DEVICE_URL = `${BASE_GOVEE_APP_URL}/device/rest/devices/v1`;
const BASE_GOVEE_APP_SKU_URL = `${BASE_GOVEE_APP_URL}/appsku/v1`;

@Injectable()
export class RestClient
  extends GoveeClient {

  private readonly clientId: string;

  constructor(
    eventEmitter: EventEmitter2,
    private config: ConfigurationService,
    private persist: PersistService,
    private readonly log: LoggingService,
    @Inject(GOVEE_CLIENT_ID) clientId: string,
  ) {
    super(eventEmitter);
    this.clientId =
      this.persist.oauthData?.clientId || clientId;
  }

  @OnEvent(
    'REST.AUTHENTICATION.Authenticate',
  )
  async login(requestDevices = false): Promise<OAuthData | undefined> {
    this.log.debug(
      'RestClient',
      'login',
      'Request Devices?',
      requestDevices,
    );
    if (this.isTokenValid(this.persist.oauthData?.token)) {
      const oauthData = this.persist.oauthData!;
      this.persist.oauthData = oauthData;

      await this.emitAsync(
        new IoTSubscribeToEvent(oauthData.accountIoTTopic || ''),
      );
      await this.emitAsync(new RestAuthenticatedEvent(oauthData));
      if (requestDevices) {
        this.emit(new RestRequestDevices());
      }
      return oauthData;
    }

    try {
      const authData = await this.authenticate();

      if (authData?.accountIoTTopic) {
        await this.emitAsync(
          new IoTSubscribeToEvent(authData.accountIoTTopic),
        );
      }
      if (requestDevices) {
        await this.emitAsync(new RestAuthenticatedEvent(authData));
        await this.emit(new RestRequestDevices());
      }
      return authData;
    } catch (error) {
      this.log.error('RestClient', 'Authenticate', error);
      await this.emitAsync(
        new RestAuthenticationFailureEvent(
          (error as ApiError).status,
        ),
      );
    }

    return undefined;
  }

  private async authenticate(): Promise<OAuthData> {
    this.log.info('Authenticating');
    const res = await request<LoginRequest, LoginResponse>(
      `${BASE_GOVEE_APP_ACCOUNT_URL}/login`,
      BaseHeaders(
        this.clientId,
        GOVEE_APP_VERSION,
      ),
      loginRequest(
        this.config.username,
        this.config.password,
        this.clientId,
      ),
    ).post();

    const client = res.data.client;
    if (!client) {
      throw new ApiError(
        'Error encountered during authentication',
        {
          statusCode: res.status,
          message: res.statusText,
        },
      );
    }

    const oauthData: OAuthData = {
      token: client.token,
      accountIoTTopic: client.topic,
      refreshToken: client.refreshToken,
      clientId: this.clientId,
    };

    this.persist.oauthData = oauthData;
    this.log.debug('RestClient', 'authenticate', oauthData);
    return oauthData;
  }

  // private async refreshToken(): Promise<OAuthData> {
  //   this.log.debug('REFRESH TOKEN');
  //   return request<TokenRefreshRequest, TokenRefreshResponse>(
  //     `${BASE_GOVEE_APP_ACCOUNT_URL}/refresh-tokens`,
  //     AuthenticatedHeader(
  //       this.clientId,
  //       GOVEE_APP_VERSION,
  //       this.persist.oauthData?.token || '',
  //     ),
  //     tokenRefreshRequest(
  //       this.persist.oauthData?.refreshToken || '',
  //     ),
  //   )
  //     .post()
  //     .then((res) => {
  //       if (res.status !== 200) {
  //         throw new ApiError(
  //           'Error encountered during authentication',
  //           {
  //             statusCode: res.status,
  //             message: res.statusText,
  //           },
  //         );
  //       }
  //       return {
  //         token: res.data.token,
  //         accountIoTTopic: this.persist.oauthData?.accountIoTTopic,
  //         refreshToken: res.data.refreshToken,
  //       };
  //     })
  //     .then(
  //       (authData: OAuthData) => {
  //         this.persist.oauthData = authData;
  //         this.emit(
  //           new IoTSubscribeToEvent(authData?.accountIoTTopic || ''),
  //         );
  //         return authData;
  //       },
  //     );
  // }
  @OnEvent(
    'REST.REQUEST.DeviceScenes',
  )
  async getDeviceScenes(device: GoveeDevice) {
    try {
      const authData = await this.login(false);
      if (!authData) {
        return;
      }

      const res = await request<DeviceSceneRequest, DeviceSceneListResponse>(
        `${BASE_GOVEE_APP_SKU_URL}/light-effect-libraries`,
        AuthenticatedHeader(
          this.clientId,
          GOVEE_APP_VERSION,
          authData.token || '',
        ),
        deviceSceneRequest(device),
      ).get();
      await this.emitAsync(
        new RestDeviceScenesResponse(res.data),
      );
    } catch (error) {
      this.log.error('RestClient', 'getDIYGroups', error);
    }
  }

  ///appsku/v1/light-effect-libraries
  @OnEvent(
    'REST.REQUEST.DIYEffects',
  )
  async getDIYGroups() {
    try {
      const authData = await this.login(false);
      if (!authData) {
        return;
      }

      const res = await request<BaseRequest, DIYListResponse>(
        `${BASE_GOVEE_APP_SKU_URL}/diys/groups-diys`,
        AuthenticatedHeader(
          this.clientId,
          GOVEE_APP_VERSION,
          authData.token || '',
        ),
      ).get();
      await this.emitAsync(
        new RestDIYEffectResponse(res.data),
      );
    } catch (error) {
      this.log.error('RestClient', 'getDIYGroups', error);
    }
  }

  @OnEvent(
    'REST.REQUEST.Devices',
  )
  async getDevices(): Promise<void> {
    this.log.debug(
      'RestClient',
      'getDevices',
    );
    try {
      const authData = await this.login(false);
      if (!authData) {
        return;
      }

      const res = await request<BaseRequest, AppDeviceListResponse>(
        `${BASE_GOVEE_APP_DEVICE_URL}/list`,
        AuthenticatedHeader(
          this.clientId,
          GOVEE_APP_VERSION,
          authData.token || '',
        ),
      ).post();
      await this.emitAsync(
        new RestResponseDeviceList(res.data),
      );
      await this.emitAsync(
        new RestRequestDIYEffects(),
      );
      setTimeout(
        () => this.emit(
          new RestRequestDevices(),
        ),
        60 * 60 * 1000,
      );
    } catch (error) {
      this.log.error('RestClient', 'getDevices', error);
    }
  }

  private decodeJWT(token?: string): JWTPayload | undefined {
    if (!token) {
      return undefined;
    }
    try {
      return jwtDecode<JWTPayload>(token, {});
    } catch (error) {
      this.log.error('RestClient', 'decodeJWT', error);
    }
  }

  private isTokenValid(token?: string): boolean {
    const jwt = this.decodeJWT(token);
    try {
      if (!jwt?.exp || !jwt?.iat) {
        return false;
      }
      const expirationDateUTC = new Date(1970, 1, 1).setSeconds(jwt.exp);
      const nowUTC = new Date().getUTCSeconds();
      return nowUTC < expirationDateUTC;
    } catch (error) {
      this.log.error(
        'RestClient',
        'isTokenValid',
        error,
      );
    }

    return false;
  }
}
