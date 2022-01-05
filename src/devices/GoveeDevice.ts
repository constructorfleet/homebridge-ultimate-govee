import {DeviceConfig} from '../core/events/devices/configs/DeviceConfig';
import {supportsIoT} from '../core/events/devices/configs/IoTConfig';
import {Constructor} from '../util/types';
import {applyDecorators, Global, Module} from '@nestjs/common';
import {Provider} from '@nestjs/common/interfaces/modules/provider.interface';

export function Models<DeviceType extends GoveeDevice>(
  ...models: string[]
): (target: Constructor<DeviceType>) => void {
  console.log(`MODELS ${models}`);
  return function(target: Constructor<DeviceType>) {
    console.log('Apply decorator');
    return applyDecorators(
      Module({
          providers: models.map(
            (model): Provider => {
              return {
                provide: model,
                useFactory: (config) => new target(config),
              };
            },
          ),
          exports: models,
        },
      ),
    );
  };
}

// export function Models<DeviceType extends GoveeDevice>(
//   ...models: string[]
// ): (target: Constructor<DeviceType>) => void {
//   console.log(`Models decorator: ${models}`);
//   return function(target: Constructor<DeviceType>) {
//     models.forEach(
//       (model) =>
//         container.registerInstance<Constructor<DeviceType>>(
//           model,
//           target,
//         ),
//     );
//     return target;
//   };
// }

export abstract class GoveeDevice {
  static MODELS: string[] = [];

  protected constructor(
    deviceConfig: DeviceConfig,
  ) {
    console.log(deviceConfig);
    this.deviceId = deviceConfig.deviceId;
    this.model = deviceConfig.model;
    this.name = deviceConfig.name;
    this.pactCode = deviceConfig.pactCode;
    this.pactType = deviceConfig.pactType;
    this.iotTopic = supportsIoT(deviceConfig)?.deviceTopic ?? undefined;
    this.hardwareVersion = deviceConfig.hardwareVersion;
    this.softwareVersion = deviceConfig.softwareVersion;
  }

  public deviceId: string;
  public model: string;
  public name: string;
  public pactCode: number;
  public pactType: number;
  public iotTopic?: string;
  public hardwareVersion?: string;
  public softwareVersion?: string;

  public abstract send(payload: unknown): void;

  public abstract receive(payload: unknown): void;
}