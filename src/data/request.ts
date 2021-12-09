import {BaseRequest} from './structures/api/requests/payloads/base/BaseRequest';
import {BaseResponse} from './structures/api/requests/payloads/base/BaseResponse';
import axios, {AxiosResponse} from 'axios';

export function request<PayloadType extends BaseRequest,
  ResponseType extends BaseResponse>
(
  url: string,
  headers: Record<string, string>,
  payload: PayloadType | undefined = undefined,
): Request<PayloadType, ResponseType> {
  return new Request<PayloadType, ResponseType>(
    url,
    headers,
    payload,
  );
}

class Request<PayloadType extends BaseRequest,
  ResponseType extends BaseResponse> {

  constructor(
    private url: string,
    private headers: Record<string, string>,
    private payload: PayloadType | undefined = undefined,
  ) {
  }

  async get(): Promise<AxiosResponse<ResponseType>> {
    return await axios.get(
      this.url,
      {
        timeout: 10000,
        headers: this.headers,
        params: this.payload,
      },
    );
  }

  async post(): Promise<AxiosResponse<ResponseType>> {
    return await axios.post(
      this.url,
      this.payload,
      {
        timeout: 10000,
        headers: this.headers,
      },
    );
  }
}
