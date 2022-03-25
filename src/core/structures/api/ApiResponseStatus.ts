export interface ApiResponseStatus {
  statusCode: number;
  message: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: ApiResponseStatus,
  ) {
    super(message);
  }
}