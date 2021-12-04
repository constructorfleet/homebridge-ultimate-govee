import {
  Expose,
  Type,
} from 'class-transformer';
import {BaseResponse} from './base/baseResponse';

export class LoginResponse extends BaseResponse {
  @Expose({name: 'client'})
  @Type(() => ClientInfo)
  public clientInfo!: ClientInfo;
}

export class ClientInfo {
  @Expose({name: 'A'})
  public iotCertificate!: string;

  @Expose({name: 'B'})
  public iotPrivateKey!: string;

  @Expose({name: 'topic'})
  public iotAccountTopic!: string;

  @Expose({name: 'token'})
  public bearerToken!: string;

  @Expose({name: 'refreshToken'})
  public refreshToken!: string;

  @Expose({name: 'tokenExpireCycle'})
  public tokenExpireSeconds!: number;

  @Expose({name: 'client'})
  public client!: string;

  @Expose({name: 'clientName'})
  public clientName!: string;

  @Expose({name: 'accountId'})
  public accountId!: number;

  @Expose({name: 'pushToken'})
  public pushToken!: string;

  @Expose({name: 'versionCode'})
  public versionCode!: string;

  @Expose({name: 'versionName'})
  public versionName!: string;

  @Expose({name: 'sysVersion'})
  public systemVersion!: string;

  @Expose({name: 'isSavvyUser'})
  public isSavvyUser!: boolean;
}
