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
  constructor() {
    super();
  }

  public refreshToken!: string;
}