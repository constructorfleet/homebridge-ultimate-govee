import {BaseRequest} from '../core/structures/api/requests/payloads/BaseRequest';
import {BaseResponse} from '../core/structures/api/responses/payloads/BaseResponse';
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

  get(): Promise<AxiosResponse<ResponseType>> {
    return axios.get(
      this.url,
      {
        timeout: 10000,
        headers: this.headers,
        params: this.payload,
      },
    );
  }

  post(): Promise<AxiosResponse<ResponseType>> {
    console.log(this.payload);
    console.log(this.headers);
    console.log(this.url);
    return axios.post(
      this.url,
      this.payload,
      {
        timeout: 10000,
        headers: this.headers,
      },
    );
  }
}
