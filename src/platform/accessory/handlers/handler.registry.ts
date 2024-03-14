import { Injectable, Type } from '@nestjs/common';
import { ServiceHandler } from './service.handler';
import { Device, DeviceStatesType } from '@constructorfleet/ultimate-govee';
import { ModuleRef } from '@nestjs/core';
import { SubServiceHandlerFactory } from './handler.factory';
import { GoveeAccessory } from '../govee.accessory';

@Injectable()
export class HandlerRegistry {
  private static handlerMap: Map<string, Type<ServiceHandler<any>>[]> =
    new Map();
  private static factoryMap: Map<
    string,
    Type<SubServiceHandlerFactory<any>>[]
  > = new Map();

  static forDevice(
    ...devices: (Type<Device<any>> & { deviceType: string })[]
  ): (ctor: Type<ServiceHandler<any>>) => void {
    return (ctor: Type<ServiceHandler<any>>) => {
      devices.forEach((device) => {
        const handlers = this.handlerMap.get(device.deviceType) ?? [];
        handlers.push(ctor);
        this.handlerMap.set(device.deviceType, handlers);
      });
    };
  }

  static factoryFor(
    ...devices: (Type<Device<any>> & { deviceType: string })[]
  ): (ctor: Type<SubServiceHandlerFactory<any>>) => void {
    return (ctor: Type<SubServiceHandlerFactory<any>>) => {
      devices.forEach((device) => {
        const handlers = this.factoryMap.get(device.deviceType) ?? [];
        handlers.push(ctor);
        this.factoryMap.set(device.deviceType, handlers);
      });
    };
  }

  private deviceTypeHandlers: Map<string, ServiceHandler<any>[]> = new Map();

  constructor(
    private readonly moduleRef: ModuleRef,
  ) {}

  async for<States extends DeviceStatesType>(
    accessory: GoveeAccessory<States>,
  ): Promise<ServiceHandler<States>[]> {
    const handlers: ServiceHandler<any>[] =
      this.deviceTypeHandlers.get(accessory.deviceType) ??
      ([] as ServiceHandler<any>[]);
    (await Promise.all([
      this.getHandlersFor(accessory),
      this.getHandlersFromFactories(accessory)
    ])).flat()
      .filter(
        (handler) =>
          handlers.find(
            (h) =>
              h.serviceType.UUID === handler.serviceType.UUID &&
              h.subType === handler.subType,
          ) === undefined,
      )
      .forEach((handler) => handlers.push(handler));
    this.deviceTypeHandlers.set(accessory.deviceType, handlers);
    return handlers;
  }

  private async getHandlersFor<States extends DeviceStatesType>(
    accessory: GoveeAccessory<States>,
  ): Promise<ServiceHandler<States>[]> {
    const tokens = HandlerRegistry.handlerMap.get(accessory.device.deviceType);
    if (tokens === undefined) {
      return [];
    }
    return (
      await Promise.all(
        tokens.map(async (token) => {
          if (token === undefined) {
            return undefined;
          }
          let handler: ServiceHandler<any>;
          try {
            handler = this.moduleRef.get(token);
          } catch {
            handler = await this.moduleRef.create(token);
          }

          return handler;
        }),
      )
    )
      .filter((h) => h !== undefined)
      .map((h) => h!);
  }

  private async getHandlersFromFactories<States extends DeviceStatesType>(
    accessory: GoveeAccessory<States>,
  ): Promise<ServiceHandler<States>[]> {
    const tokens = HandlerRegistry.factoryMap.get(accessory.device.deviceType);
    if (tokens === undefined) {
      return [];
    }
    return (
      await Promise.all(
        tokens.map(async (token) => {
          if (token === undefined) {
            return [];
          }
          let handlerFactory: SubServiceHandlerFactory<any> | undefined;
          try {
            handlerFactory = this.moduleRef.get(token);
          } catch {
            handlerFactory = await this.moduleRef.create(token);
          }
          if (handlerFactory === undefined) {
            return [];
          }
          return await handlerFactory.for(accessory);
        }),
      )
    ).flat() as ServiceHandler<any>[];
  }

  async updateAccessoryHandlers<States extends DeviceStatesType>(
    accessory: GoveeAccessory<States>,
  ) {
    (await this.for(accessory)).forEach((handler) => {
      if (handler.isPrimary || handler.subType === undefined || handler.isEnabled(accessory, handler.subType)) {
        handler.setup(accessory);
      }
      // if (handler.isEnabled(accessory, handler.subType)) {
      //   handler.setup(accessory);
      // } else {
      //   handler.tearDown(accessory);
      // }
    });
  }
}