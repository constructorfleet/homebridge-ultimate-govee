import {BaseResponse} from './base/BaseResponse';

export class ApiDeviceListResponse extends BaseResponse {
  constructor() {
    super();
  }

  public data!: DeviceListData;
}

class DeviceListData {
  public devices!: Device[];
}

class Device {
  public device!: string;

  public model!: string;

  public deviceName!: string;

  public controllable!: boolean;

  public retrievable!: boolean;

  public supportCmds!: string[];

  public properties!: DeviceProperties;
}

class DeviceProperties {
  public colorTem!: ColorTemperature;
}

class ColorTemperature {
  public range!: Range;
}

class Range {
  public min!: number;

  public max!: number;
}