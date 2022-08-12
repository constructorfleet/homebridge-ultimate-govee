// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AuthenticationCredentials {
}

export interface BasicCredentials
    extends AuthenticationCredentials {
  readonly username: string;
  readonly password: string;
}

export interface ClientIdBasicCredentials
    extends BasicCredentials {
  readonly clientId: string;
}

export interface OAuthCredentials
    extends AuthenticationCredentials {
  readonly clientId: string;
  readonly clientSecret: string;
}
