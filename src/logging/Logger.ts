export type Logger = {
  info(message: unknown, ...parameters: unknown[]): void;

  warn(message: unknown, ...parameters: unknown[]): void;

  error(message: unknown, ...parameters: unknown[]): void;

  debug(message: unknown, ...parameters: unknown[]): void;
}