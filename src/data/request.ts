import {BaseHeaders} from './structures/api/requests/headers/baseHeaders';
import {BaseRequest} from './structures/api/requests/payloads/base/baseRequest';
import {BaseResponse} from './structures/api/requests/payloads/base/baseResponse';
import axios from 'axios';
import {instanceToPlain} from 'class-transformer';

export function request<HeaderType extends BaseHeaders,
  PayloadType extends BaseRequest,
  ResponseType extends BaseResponse>
(
  url: string,
  headers: HeaderType,
  payload: PayloadType,
): Request<HeaderType, PayloadType, ResponseType> {
  return new Request<HeaderType, PayloadType, ResponseType>(
    url,
    headers,
    payload,
  );
}

class Request<HeaderType extends BaseHeaders,
  PayloadType extends BaseRequest,
  ResponseType extends BaseResponse> {

  constructor(
    private url: string,
    private headers: HeaderType,
    private payload: PayloadType | undefined,
  ) {
  }

  async get(): Promise<ResponseType> {
    return await axios.get<PayloadType, ResponseType>(
      this.url,
      {
        timeout: 10000,
        headers: instanceToPlain(this.headers),
        params: this.payload
          ? instanceToPlain(this.payload)
          : {},
      },
    ).catch(err => {
      throw Error(err);
    });
  }

  async post(): Promise<ResponseType> {
    return await axios.post<PayloadType, ResponseType>(
      this.url,
      {
        timeout: 10000,
        headers: instanceToPlain(this.headers),
        data: this.payload
          ? instanceToPlain(this.payload)
          : {},
      },
    ).catch(err => {
      throw Error(err);
    });
  }
}
