import {BaseResponse} from './base/baseResponse';
import {Expose, Transform, Type} from 'class-transformer';

export class DeviceListResponse extends BaseResponse {
  @Expose({name: 'devices'})
  @Type(() => DeviceInformation)
  public devices!: DeviceInformation[];
}

class DeviceInformation {
  @Expose({name: 'groupId'})
  public groupId!: number;

  @Expose({name: 'device'})
  public deviceId!: string;

  @Expose({name: 'sku'})
  public deviceModel!: string;

  @Expose({name: 'spec'})
  public specification!: string;

  @Expose({name: 'versionHard'})
  public hardwareVersion!: string;

  @Expose({name: 'versionSoft'})
  public softwareVersion!: string;

  @Expose({name: 'deviceName'})
  public deviceName!: string;

  @Expose({name: 'pactType'})
  public pactType!: number;

  @Expose({name: 'pactCode'})
  public pactCode!: number;

  @Expose({name: 'goodsType'})
  public goodsType!: number;

  @Expose({name:'deviceExt'})
  @Type(() => DeviceExtensionProperties)
  public deviceExtensionProperties!: DeviceExtensionProperties;
}

class DeviceExtensionProperties {
  @Expose({name: 'deviceSettings'})
  @Type(() => DeviceSettings)
  @Transform(({value}) => JSON.parse(value), {toClassOnly: true})
  @Transform(({value}) => JSON.stringify(value), {toPlainOnly: true})
  public deviceSettings!: DeviceSettings;

  @Expose({name: 'lastDeviceData'})
  @Type(() => DeviceData)
  @Transform(({value}) => JSON.parse(value), {toClassOnly: true})
  @Transform(({value}) => JSON.stringify(value), {toPlainOnly: true})
  public lastDeviceData!: DeviceData;

  @Expose({name: 'extResources'})
  @Type(() => DeviceExternalResources)
  @Transform(({value}) => JSON.parse(value), {toClassOnly: true})
  @Transform(({value}) => JSON.stringify(value), {toPlainOnly: true})
  public externalResources!: string;
}

class DeviceSettings {
  @Expose({name: 'wifiName'})
  public wifiSSID?: string;

  @Expose({name: 'wifiMac'})
  public wifiMACAddress?: string;

  @Expose({name: 'bleName'})
  public bleName?: string;

  @Expose({name: 'topic'})
  public iotDeviceTopic?: string;

  @Expose({name: 'address'})
  public address?: string;

  @Expose({name: 'pactType'})
  public pactType!: number;

  @Expose({name: 'pactCode'})
  public pactCode!: number;

  @Expose({name: 'wifiSoftVersion'})
  public wifiSoftwareVersion?: string;

  @Expose({name: 'wifiHardVersion'})
  public wifiHardwareVersion?: string;

  @Expose({name: 'versionHard'})
  public hardwareVersion!: string;

  @Expose({name: 'versionSoft'})
  public softwareVersion!: string;

  @Expose({name: 'ic'})
  public ic!: number;

  @Expose({name: 'secretCode'})
  public secretCode?: string;

  @Expose({name: 'device'})
  public deviceId!: string;

  @Expose({name: 'deviceName'})
  public deviceName!: string;

  @Expose({name: 'sku'})
  public deviceModel!: string;

  @Expose({name: 'waterShortageOnOff'})
  public waterShortage?: number;
}

class DeviceData {
  @Expose({name: 'online'})
  public isOnline!: boolean;

  @Expose({name: 'onOff'})
  public isOnOff?: number;
}

class DeviceExternalResources {
  @Expose({name: 'skuUrl'})
  public skuImageUrl?: string;

  @Expose({name: 'headOnImg'})
  public onImageUrl?: string;

  @Expose({name: 'headOffImg'})
  public offImageUrl?: string;

  @Expose({name: 'ext'})
  public ext?: string;

  @Expose({name: 'ic'})
  public ic?: number;
}
