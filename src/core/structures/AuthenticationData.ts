// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AuthenticationData {
}

export interface TokenAuthData extends AuthenticationData {
  readonly token: string;
}

export interface OAuthData extends TokenAuthData {
  readonly refreshToken: string;
  readonly tokenExpiration: number;
  readonly accountIoTTopic?: string;
}
