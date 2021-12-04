import {BaseResponse} from './base/baseResponse';
import {Expose, Type} from 'class-transformer';

export class ApiDeviceListResponse extends BaseResponse {
  @Expose({name: 'data'})
  @Type(() => DeviceListData)
  public data!: DeviceListData;
}

class DeviceListData {
  @Expose({name: 'devices'})
  @Type(() => Device)
  public devices!: Device[];
}

class Device {
  @Expose({name: 'device'})
  public deviceId!: string;

  @Expose({name: 'model'})
  public model!: string;

  @Expose({name: 'deviceName'})
  public deviceName!: string;

  @Expose({name: 'controllable'})
  public isControllable!: boolean;

  @Expose({name: 'retrievable'})
  public isRetrievable!: boolean;

  @Expose({name: 'supportCmds'})
  public supportedCommands!: string[];

  @Expose({name: 'properties'})
  @Type(() => DeviceProperties)
  public deviceProperties!: DeviceProperties;
}

class DeviceProperties {
  @Expose({name: 'colorTem'})
  @Type(() => ColorTemperature)
  public colorTemperature!: ColorTemperature;
}

class ColorTemperature {
  @Expose({name: 'range'})
  @Type(() => Range)
  public range!: Range;
}

class Range {
  @Expose({name: 'min'})
  public minimum!: number;

  @Expose({name: 'max'})
  public maximum!: number;
}