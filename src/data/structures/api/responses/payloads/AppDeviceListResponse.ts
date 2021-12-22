import {BaseResponse} from './BaseResponse';
import {
  Expose,
  instanceToPlain,
  plainToInstance,
  Transform,
  Type,
} from 'class-transformer';
import {DeviceResponse} from '../DeviceResponse';

export class AppDeviceListResponse
  extends BaseResponse {
  @Expose({name: 'devices'})
  @Type(() => AppDevice)
  public devices!: AppDevice[];
}

export class AppDevice
  implements DeviceResponse {
  public kind!: 'AppDevice';

  @Expose({name: 'groupId'})
  public groupId!: number;

  @Expose({name: 'device'})
  public device!: string;

  @Expose({name: 'sku'})
  public sku!: string;

  @Expose({name: 'spec'})
  public spec!: string;

  @Expose({name: 'versionHard'})
  public versionHard!: string;

  @Expose({name: 'versionSoft'})
  public versionSoft!: string;

  @Expose({name: 'deviceName'})
  public deviceName!: string;

  @Expose({name: 'pactType'})
  public pactType!: number;

  @Expose({name: 'pactCode'})
  public pactCode!: number;

  @Expose({name: 'goodsType'})
  public goodsType!: number;

  @Expose({name: 'deviceExt'})
  @Type(() => DeviceExtensionProperties)
  public deviceExt!: DeviceExtensionProperties;
}

export class DeviceExtensionProperties {
  @Type(() => AppDeviceSettings)
  @Transform(
    (params) => JSON.stringify(
      instanceToPlain(params.value),
    ),
    {
      toPlainOnly: true,
    },
  )
  @Transform(
    (params) =>
      plainToInstance<AppDeviceSettings, string>(
        AppDeviceSettings,
        JSON.parse(params.value),
      ),
    {
      toClassOnly: true,
    },
  )
  public deviceSettings!: string;

  @Expose({toPlainOnly: true})
  public lastDeviceData!: string;

  @Expose({toPlainOnly: true})
  public extResources!: string;
}

export class AppDeviceSettings {
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

export class AppDeviceData {
  @Expose({name: 'online'})
  public isOnline!: boolean;

  @Expose({name: 'onOff'})
  public isOnOff?: number;
}

export class AppDeviceExternalResources {
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
