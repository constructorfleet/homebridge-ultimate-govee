import {BaseRequest} from './structures/api/requests/payloads/BaseRequest';
import {BaseResponse} from './structures/api/responses/payloads/BaseResponse';
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
    console.log(this.url);
    console.log(this.payload);
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
    console.log(this.url);
    console.log(this.payload);
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
