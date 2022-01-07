import {DeviceConfig} from '../core/structures/devices/configs/DeviceConfig';
import {supportsIoT} from '../core/structures/devices/configs/IoTConfig';
import {Constructor} from '../util/types';
import {applyDecorators, Module} from '@nestjs/common';
import {Provider} from '@nestjs/common/interfaces/modules/provider.interface';
import {DeviceState} from '../core/structures/devices/DeviceState';
import {State} from './states/State';

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

export class GoveeDevice extends State {
  static MODELS: string[] = [];

  constructor(
    deviceConfig: DeviceConfig,
  ) {
    super();
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

  public send(state: DeviceState): void {
  }

  public receive(state: DeviceState) {
    this.parse(state);
  }
}
