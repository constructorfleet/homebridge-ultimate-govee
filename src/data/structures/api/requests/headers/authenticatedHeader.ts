import {BaseHeaders} from './baseHeaders';
import {Expose} from 'class-transformer';

export class AuthenticatedHeader extends BaseHeaders {
  public static build(bearerToken: string): AuthenticatedHeader {
    const headers = new AuthenticatedHeader();
    headers.bearerToken = bearerToken;

    return headers;
  }

  @Expose({name: 'Authentication'})
  public bearerToken!: string;
}