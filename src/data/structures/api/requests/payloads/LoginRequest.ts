import {BaseRequest} from './base/BaseRequest';

export function loginRequest(
  username: string,
  password: string,
  clientId: string,
): LoginRequest {
  const request = new LoginRequest();
  request.email = username;
  request.password = password;
  request.client = clientId;

  return request;
}

export class LoginRequest
  extends BaseRequest {
  constructor() {
    super();
  }

  public email!: string;

  public password!: string;

  public client!: string;
}