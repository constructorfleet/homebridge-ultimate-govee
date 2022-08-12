import {Inject, Injectable} from '@nestjs/common';
import {GoveeClient} from './GoveeClient';
import {EventEmitter2, OnEvent} from '@nestjs/event-emitter';
import {LoggingService} from '../../logging';
import {PersistService} from '../../persist';
import {CONF_PASSWORD, CONF_USERNAME, GOVEE_CLIENT_ID} from '../../util';
import {
  ApiError,
  IoTSubscribeToEvent,
  JWTPayload,
  OAuthData,
  RestAuthenticatedEvent,
  RestAuthenticationFailureEvent,
  RestDeviceScenesResponse,
  RestDIYEffectResponse,
  RestRequestDevices,
  RestResponseDeviceList
} from '../../core';
import {request} from '../request';
import {
  AuthenticatedHeader,
  BaseHeaders,
  BaseRequest,
  DeviceSceneRequest,
  deviceSceneRequest,
  LoginRequest
} from '../../core/structures/api/requests';
import {
  AppDeviceListResponse,
  DeviceSceneListResponse,
  DIYListResponse,
  LoginResponse
} from '../../core/structures/api/responses';
import {ConfigService} from '@nestjs/config';
import jwtDecode from 'jwt-decode';
import {GoveeDevice} from '../../devices';

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
      private config: ConfigService,
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

  // }
  @OnEvent(
      'REST.REQUEST.DeviceScenes',
  )
  async getDeviceScenes(device: GoveeDevice) {
    this.log.info(
        'RestClient',
        'Getting device scenes',
    );
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
          new RestDeviceScenesResponse(
              {
                device: device,
                response: res.data,
              },
          ),
      );
    } catch (error) {
      this.log.error('RestClient', 'getDeviceScenes', error);
    }
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

  @OnEvent(
      'REST.REQUEST.DIYEffects',
  )
  async getDIYGroups() {
    this.log.info(
        'RestClient',
        'Getting DIY effects',
    );
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
    this.log.info(
        'RestClient',
        'Getting list of devices',
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

  private async authenticate(): Promise<OAuthData> {
    this.log.info('Authenticating');
    const res = await request<LoginRequest, LoginResponse>(
        `${BASE_GOVEE_APP_ACCOUNT_URL}/login`,
        BaseHeaders(
            this.clientId,
            GOVEE_APP_VERSION,
        ),
        new LoginRequest(
            this.config.get<string>(CONF_USERNAME) ?? '',
            this.config.get<string>(CONF_PASSWORD) ?? '',
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
    return oauthData;
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
      const nowUTC = new Date().getTime();
      this.log.debug('RestClient', 'isTokenValid', expirationDateUTC, nowUTC);
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
