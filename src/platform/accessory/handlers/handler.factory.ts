import { DeviceStatesType } from '@constructorfleet/ultimate-govee';
import { InjectHomebridgeApi } from '../accessory.const';
import { API } from 'homebridge';
import { ModuleRef } from '@nestjs/core';
import {
  IsServiceEnabled,
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
import { GoveeAccessory } from '../govee.accessory';
import { Logger } from '@nestjs/common';

export abstract class SubServiceHandlerFactory<
  States extends DeviceStatesType,
> {
  protected abstract readonly serviceType: ServiceType;
  protected abstract readonly handlers: ServiceCharacteristicHandlerFactory<States>;
  abstract readonly isEnabled: IsServiceEnabled<States>;
  protected abstract readonly possibleSubTypes: ServiceSubTypes<States>;
  protected abstract readonly name: ServiceName<States>;
  protected abstract readonly isPrimary: boolean;
  private readonly handlerMap: Map<string, SubServiceHandler<States>> =
    new Map();
  private readonly deviceTypeHandlers: Map<
    string,
    SubServiceHandler<States>[]
  > = new Map();
  protected readonly logger: Logger = new Logger();

  constructor(
    @InjectHomebridgeApi private readonly api: API,
    private readonly moduleRef: ModuleRef,
  ) {}

  async for(
    accessory: GoveeAccessory<States>,
  ): Promise<SubServiceHandler<States>[]> {
    const possibleSubTypes = this.possibleSubTypes(accessory);
    if (possibleSubTypes === undefined) {
      return [];
    }

    const handlers =
      this.deviceTypeHandlers.get(accessory.device.deviceType) ?? [];

    await Promise.all(
      possibleSubTypes?.map(async (subType) => {
        const identifier = getServiceIdentifier(
          accessory.device.deviceType,
          this.serviceType,
          subType,
        );
        let handler = this.handlerMap.get(identifier);
        if (handler !== undefined) {
          return;
        }
        const handlerType = GetSubServiceHandler(
          accessory.device,
          this.serviceType,
          subType,
          this.name,
          this.handlers(accessory, subType),
          this.isEnabled,
          this.isPrimary,
        );
        try {
          handler = this.moduleRef.get(handlerType);
          this.handlerMap.set(identifier, handler!);
        } catch {
          handler = await this.moduleRef.create(handlerType);
          this.handlerMap.set(identifier, handler);
        }
        if (handler === undefined) {
          return;
        }
        if (
          handlers.find(
            (h) =>
              h.serviceType.UUID === handler?.serviceType.UUID &&
              h.subType === handler?.subType,
          ) === undefined
        ) {
          handlers.push(handler);
        }
      }),
    );

    this.deviceTypeHandlers.set(accessory.device.deviceType, handlers);
    return handlers;
  }
}
