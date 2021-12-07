import {BaseResponse} from './base/BaseResponse';
import {Expose, plainToInstance} from 'class-transformer';

export class AppDeviceListResponse extends BaseResponse {
  public devices!: DeviceInformation[];
}

class DeviceInformation {
  public groupId!: number;

  public device!: string;

  public sku!: string;

  public spec!: string;

  public versionHard!: string;

  public versionSoft!: string;

  public deviceName!: string;

  public pactType!: number;

  public pactCode!: number;

  public goodsType!: number;

  public deviceExt!: DeviceExtensionProperties;
}

class DeviceExtensionProperties {
  public get settings(): DeviceSettings {
    return plainToInstance(DeviceSettings, JSON.parse(this.deviceSettings));
  }

  public get deviceData(): DeviceData {
    return plainToInstance(DeviceData, JSON.parse(this.lastDeviceData));
  }

  public get externalResources(): DeviceExternalResources {
    return plainToInstance(DeviceExternalResources,
      JSON.parse(this.extResources));
  }

  @Expose({toPlainOnly: true})
  public deviceSettings!: string;

  @Expose({toPlainOnly: true})
  public lastDeviceData!: string;

  @Expose({toPlainOnly: true})
  public extResources!: string;
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
