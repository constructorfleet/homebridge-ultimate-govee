import {BaseResponse} from './base/BaseResponse';

export class ApiDeviceListResponse extends BaseResponse {
  constructor() {
    super();
  }

  public data!: ApiDeviceListData;
}

export class ApiDeviceListData {
  public devices!: ApiDevice[];
}

export class ApiDevice {
  public device!: string;

  public model!: string;

  public deviceName!: string;

  public controllable!: boolean;

  public retrievable!: boolean;

  public supportCmds!: string[];

  public properties!: ApiDeviceProperties;
}

export class ApiDeviceProperties {
  public colorTem!: ApiColorTemperature;
}

export class ApiColorTemperature {
  public range!: ApiRange;
}

export class ApiRange {
  public min!: number;

  public max!: number;
}