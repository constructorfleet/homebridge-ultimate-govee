import {BaseHeaders} from './baseHeaders';
import {Expose} from 'class-transformer';

export class ApiHeader extends BaseHeaders {
  public static build(apiKey: string): ApiHeader {
    const headers = new ApiHeader();
    headers.apiKey = apiKey;

    return headers;
  }

  @Expose({name: 'Govee-API-Key'})
  public apiKey!: string;
}