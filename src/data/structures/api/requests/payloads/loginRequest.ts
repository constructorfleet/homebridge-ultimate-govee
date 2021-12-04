import {Expose} from 'class-transformer';
import {BaseRequest} from './base/baseRequest';

export class LoginRequest extends BaseRequest {
  public static build(
    username: string,
    password: string,
    clientId: string,
  ): LoginRequest {
    const request = new LoginRequest();
    request.username = username;
    request.password = password;
    request.clientId = clientId;

    return request;
  }

  @Expose({name: 'email'})
  public username!: string;

  @Expose({name: 'password'})
  public password!: string;

  @Expose({name: 'client'})
  public clientId!: string;
}