import {BaseResponse} from './BaseResponse';

export class TokenRefreshResponse
  extends BaseResponse {
  public refreshToken!: string;
  public token!: string;
  public tokenExpireCycle!: number;

  constructor() {
    super();
  }
}
