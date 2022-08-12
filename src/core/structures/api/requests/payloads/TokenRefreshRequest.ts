import {BaseRequest} from './BaseRequest';

export function tokenRefreshRequest(
    refreshToken: string,
): TokenRefreshRequest {
  const request = new TokenRefreshRequest();
  request.refreshToken = refreshToken;

  return request;
}

export class TokenRefreshRequest
    extends BaseRequest {
  public refreshToken!: string;

  constructor() {
    super();
  }
}
