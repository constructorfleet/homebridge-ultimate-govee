import { Device, DeviceStatesType } from '@constructorfleet/ultimate-govee';
import { InjectHomebridgeApi } from '../accessory.const';
import { API, PlatformAccessory } from 'homebridge';
import { ModuleRef } from '@nestjs/core';
import {
  EnabledWhen,
  ServiceCharacteristicHandlerFactory,
  ServiceName,
  ServiceSubTypes,
  ServiceType,
  SubServiceHandler,
} from './handler.types';
import {
  SubServiceHandler as GetSubServiceHandler,
  getServiceIdentifier,
} from './service.handler';

export abstract class SubServiceHandlerFactory<
  States extends DeviceStatesType,
> {
  protected abstract readonly serviceType: ServiceType;
  protected abstract readonly handlers: ServiceCharacteristicHandlerFactory<States>;
  protected abstract readonly isEnabled: EnabledWhen<States>;
  protected abstract readonly possibleSubTypes: ServiceSubTypes<States>;
  protected abstract readonly name: ServiceName<States>;

  private readonly handlerMap: Map<string, SubServiceHandler<States>> =
    new Map();

  constructor(
    @InjectHomebridgeApi private readonly api: API,
    private readonly moduleRef: ModuleRef,
  ) {}

  for(accessory: PlatformAccessory, device: Device<States>) {
    const possibleSubTypes = this.possibleSubTypes(device);
    if (possibleSubTypes === undefined) {
      return;
    }

    possibleSubTypes?.map(async (subType) => {
      const identifier = getServiceIdentifier(
        device.deviceType,
        this.serviceType,
        subType,
      );
      if (!this.handlerMap.has(identifier)) {
        const handlerType = GetSubServiceHandler(
          device,
          this.serviceType,
          subType,
          this.name,
          this.handlers(device, subType),
        );
        try {
          this.handlerMap.set(identifier, this.moduleRef.get(handlerType));
        } catch {
          this.handlerMap.set(
            identifier,
            await this.moduleRef.create(handlerType),
          );
        }
      }
    });

    device.subscribe(() => {});
  }

  private addRemoveServices(
    accessory: PlatformAccessory,
    device: Device<States>,
  ) {
    Array.from(this.handlerMap.values()).forEach((handler) => {
      if (this.isEnabled(accessory, device, handler.subType)) {
        handler.setup(accessory, device);
      } else {
        handler.tearDown(accessory, device);
      }
    });
  }
}
