import { Injectable, Type } from '@nestjs/common';
import { ServiceHandler } from './service.handler';
import { Device } from '@constructorfleet/ultimate-govee';
import { ModuleRef } from '@nestjs/core';
import { PlatformAccessory } from 'homebridge';
import { SubServiceHandlerFactory } from './handler.factory';

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

  constructor(private readonly moduleRef: ModuleRef) {}

  async for(accessory: PlatformAccessory, device: Device) {
    await this.handlersFor(accessory, device);
  }

  private async handlersFor(accessory: PlatformAccessory, device: Device) {
    const tokens = HandlerRegistry.handlerMap.get(device.deviceType);
    if (tokens === undefined) {
      return undefined;
    }
    const handlers = await Promise.all(
      tokens.map(async (token) => {
        if (token === undefined) {
          return undefined;
        }
        try {
          return this.moduleRef.get(token);
        } catch {
          return await this.moduleRef.create(token);
        }
      }),
    );
    handlers
      .filter((h) => h !== undefined)
      .map((h) => h!)
      .forEach((h) => h.setup(accessory, device));
  }

  private async factoriesFor(accessory: PlatformAccessory, device: Device) {
    const tokens = HandlerRegistry.factoryMap.get(device.deviceType);
    if (tokens === undefined) {
      return undefined;
    }
    const factories = await Promise.all(
      tokens.map(async (token) => {
        if (token === undefined) {
          return undefined;
        }
        try {
          return this.moduleRef.get(token);
        } catch {
          return await this.moduleRef.create(token);
        }
      }),
    );
    factories
      .filter((h) => h !== undefined)
      .map((h) => h!)
      .forEach((h) => h.for(accessory, device));
  }
}
