import { Expose } from 'class-transformer';

export class GoveeCredentials {
  @Expose({ name: 'username' })
  username?: string;

  @Expose({ name: 'password' })
  password?: string;

  @Expose({ name: 'apiKey' })
  apiKey?: string;
}
