export interface AuthenticationData {
  readonly accountIoTTopic?: string;
  readonly clientId: string;
}

export interface TokenAuthData extends AuthenticationData {
  readonly token: string;
}

export interface OAuthData extends TokenAuthData {
  readonly refreshToken: string;
}
