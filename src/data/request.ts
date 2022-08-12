import {BaseRequest} from '../core/structures/api/requests/payloads/BaseRequest';
import {BaseResponse} from '../core/structures/api/responses/payloads/BaseResponse';
import axios, {AxiosResponse} from 'axios';
import {ApiError} from '../core/structures/api/ApiResponseStatus';

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
    const res = await axios.get(
        this.url,
        {
          timeout: 10000,
          headers: this.headers,
          params: this.payload,
        },
    );

    if (res.status !== 200) {
      throw new ApiError(
          res.statusText,
          {
            message: res.statusText,
            statusCode: res.status,
          },
      );
    }

    return res;
  }

  async post(): Promise<AxiosResponse<ResponseType>> {
    const res = await axios.post(
        this.url,
        this.payload,
        {
          timeout: 10000,
          headers: this.headers,
        },
    );

    if (res.status !== 200 || res.data.status !== 200) {
      throw new ApiError(
          res.data.message,
          {
            message: res.data.message,
            statusCode: res.data.status,
          },
      );
    }

    return res;
  }
}
