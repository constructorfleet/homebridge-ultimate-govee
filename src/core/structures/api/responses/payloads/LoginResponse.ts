import {BaseResponse} from './BaseResponse';

export class LoginResponse
  extends BaseResponse {
  constructor() {
    super();
  }

  public client!: ClientInfo;
}

export class ClientInfo {
  public A!: string;

  public B!: string;

  public topic?: string;

  public token!: string;

  public refreshToken!: string;

  public tokenExpireCycle!: number;

  public client!: string;

  public clientName!: string;

  public accountId!: string;

  public pushToken!: string;

  public versionCode!: string;

  public versionName!: string;

  public sysVersion!: string;

  public isSavvyUser!: boolean;
}
