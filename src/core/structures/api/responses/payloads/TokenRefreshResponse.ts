import {BaseResponse} from './BaseResponse';

export class TokenRefreshResponse
  extends BaseResponse {
  constructor() {
    super();
  }

  public refreshToken!: string;

  public token!: string;

  public tokenExpireCycle!: number;
}
