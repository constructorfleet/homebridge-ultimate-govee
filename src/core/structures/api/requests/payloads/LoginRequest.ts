import {BaseRequest} from './BaseRequest';

export function loginRequest(
    username: string,
    password: string,
    clientId: string,
): LoginRequest {
  const request = new LoginRequest(
      username,
      password,
      clientId,
  );
  return request;
}

export class LoginRequest
    extends BaseRequest {
  public email!: string;
  public password!: string;
  public client!: string;

  public constructor(
      email: string,
      password: string,
      client: string,
  ) {
    super();
    this.email = email;
    this.password = password;
    this.client = client;
  }
}
