import {BaseResponse} from './BaseResponse';

export class LoginResponse
  extends BaseResponse {
  constructor() {
    super();
  }

  public client!: ClientInfo;
}

/*
{
   "message":"Login successful",
   "status":200,
   "client":{
      "A":"testiot.cert",
      "B":"testIot",
      "topic":"GA/b6f1e16783ecb12483a5dddad0eac0ba",
      "token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImFjY291bnQiOiJ7XCJjbGllbnRcIjpcImUxMDVkN2M1ODNjYjdlNDBkNGU5MmY2MmIzNzRmNDJlXCIsXCJzaWRcIjpcInp6bjRsY1M0a2YzZVhtWVpwNUh5dDBLTnpoczBBbVRxXCIsXCJhY2NvdW50SWRcIjoyNjkyMTI5LFwiZW1haWxcIjpcInRlYWdhbi5nbGVubkBpY2xvdWQuY29tXCJ9In0sImlhdCI6MTY0NDI2OTA4NiwiZXhwIjoxNjQ5NDUzMDg2fQ.9d6uqR9S6_vf67zoTMcK_5Wk6pvwUf_vpCQNOj3QTLo",
      "refreshToken":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImFjY291bnQiOiJ7XCJjbGllbnRcIjpcImUxMDVkN2M1ODNjYjdlNDBkNGU5MmY2MmIzNzRmNDJlXCIsXCJzaWRcIjpcInp6bjRsY1M0a2YzZVhtWVpwNUh5dDBLTnpoczBBbVRxXCIsXCJhY2NvdW50SWRcIjoyNjkyMTI5LFwiZW1haWxcIjpcInRlYWdhbi5nbGVubkBpY2xvdWQuY29tXCJ9In0sImlhdCI6MTY0NDI2OTA4NiwiZXhwIjoxNjU5ODIxMDg2fQ.-sSkCXblPs2cjVRMsaIJ3sKXKgZtCeXakYcofuCXiGA",
      "tokenExpireCycle":57600,
      "client":"e105d7c583cb7e40d4e92f62b374f42e",
      "clientName":"",
      "clientType":"0",
      "accountId":2692129,
      "pushToken":"",
      "versionCode":"",
      "versionName":"",
      "sysVersion":"",
      "isSavvyUser":false
   }
}
 */

export class ClientInfo {
  public A!: string;

  public B!: string;

  public topic?: string;

  public token!: string;

  public refreshToken!: string;

  public tokenExpireCycle!: number;

  public client!: string;

  public clientName!: string;

  public accountId!: number;

  public pushToken!: string;

  public versionCode!: string;

  public versionName!: string;

  public sysVersion!: string;

  public isSavvyUser!: boolean;
}
