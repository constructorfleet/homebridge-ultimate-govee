import {
  Device,
  DeviceState,
  HumidifierDevice,
  IceMakerDevice,
  ModeStateName,
  Optional,
  PurifierDevice,
  RGBICLightDevice,
  RGBLightDevice,
} from '@constructorfleet/ultimate-govee';
import { CamelCaseStringToTitleCaseString } from '@ilihub/camel-case-string-to-title-case-string';
import { Injectable } from '@nestjs/common';
import { Characteristic, Service } from 'hap-nodejs';
import { GoveeAccessory } from '../../govee.accessory';
import { SubServiceHandlerFactory } from '../handler.factory';
import { HandlerRegistry } from '../handler.registry';
import {
  CharacteristicType,
  IsServiceEnabled,
  ServiceCharacteristicHandlerFactory,
  ServiceName,
  ServiceSubTypes,
  ServiceType,
} from '../handler.types';

type DeviceWithStates = Device & {
  [StateName: string]: Optional<DeviceState<string, any>>;
};

@HandlerRegistry.factoryFor(
  RGBLightDevice,
  RGBICLightDevice,
  PurifierDevice,
  HumidifierDevice,
  IceMakerDevice,
)
@Injectable()
export class PreviousFactory extends SubServiceHandlerFactory<DeviceWithStates> {
  protected serviceType: ServiceType = Service.Switch;
  protected readonly isPrimary: boolean = false;
  protected readonly optionalCharacteristics: CharacteristicType[] = [
    Characteristic.ConfiguredName,
  ];
  protected handlers: ServiceCharacteristicHandlerFactory<DeviceWithStates> = (
    accessory: GoveeAccessory<DeviceWithStates>,
    _: string,
  ) =>
    Object.fromEntries(
      Object.keys(accessory.device.states)
        .filter((stateName) => stateName !== ModeStateName)
        .map((stateName) => [
          stateName,
          [
            {
              characteristic: Characteristic.On,
              updateValue: () => undefined,
              onSet: (value, { characteristic }) => {
                if (value !== true) {
                  return;
                }
                accessory.device.state(stateName)?.previousState(0);
                characteristic.updateValue(false);
              },
            },
          ],
        ]),
    );
  isEnabled: IsServiceEnabled<DeviceWithStates> = (
    accessory: GoveeAccessory<DeviceWithStates>,
    _?: string,
  ) => accessory.exposePreviousButton;
  protected possibleSubTypes: ServiceSubTypes<DeviceWithStates> = (
    accessory: GoveeAccessory<DeviceWithStates>,
  ) =>
    Object.keys(accessory.device.states)
      .filter((stateName) => stateName !== ModeStateName)
      .map((stateName) => `previous-${stateName}`);
  protected name: ServiceName<DeviceWithStates> = (
    _: GoveeAccessory<DeviceWithStates>,
    subType?: string,
  ) => {
    if (subType === undefined) {
      return 'Unknown';
    }

    const stateName: string = subType.split('-').slice(-1)[0] as string;
    return `Previous ${CamelCaseStringToTitleCaseString(stateName)}`;
  };
}
