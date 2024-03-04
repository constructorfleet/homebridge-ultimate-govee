import { Injectable, Type } from '@nestjs/common';
import { Service } from 'hap-nodejs';
import { ServiceHandler, DynamicServiceHandler } from './service.handler';
import { Device, Optional } from '@constructorfleet/ultimate-govee';
import { ModuleRef } from '@nestjs/core';
import { WithUUID } from 'homebridge';

@Injectable()
export class HandlerRegistry {
  private static handlerMap: Map<
    string,
    Type<ServiceHandler<any, WithUUID<Service>>>[]
  > = new Map();
  private static dynamicHandlers: Map<
    string,
    DynamicServiceHandler<any, WithUUID<Service>>[]
  > = new Map();

  static forDevice(
    ...devices: (Type<Device<any>> & { deviceType: string })[]
  ): (ctor: Type<ServiceHandler<any, WithUUID<Service>>>) => void {
    return (ctor: Type<ServiceHandler<any, WithUUID<Service>>>) => {
      devices.forEach((device) => {
        const handlers = this.handlerMap.get(device.deviceType) ?? [];
        handlers.push(ctor);
        this.handlerMap.set(device.deviceType, handlers);
      });
    };
  }

  static forDeviceDynamic(
    dynamicHandler: DynamicServiceHandler<any, WithUUID<Service>>,
    ...devices: (Type<Device<any>> & { deviceType: string })[]
  ) {
    devices.forEach((device) => {
      const handlers = this.dynamicHandlers.get(device.deviceType) ?? [];
      handlers.push(dynamicHandler);
      this.dynamicHandlers.set(device.deviceType, handlers);
    });
  }

  constructor(private readonly moduleRef: ModuleRef) {}

  async for(
    device: Device,
  ): Promise<Optional<ServiceHandler<any, WithUUID<Service>>[]>> {
    const dynamicTokens = [];
    //  HandlerRegistry.dynamicHandlers
    //   .get(device.deviceType)
    //   ?.map((dynamicHandler) => dynamicHandler(device));
    const tokens = [
      ...(dynamicTokens?.flat() ?? []),
      HandlerRegistry.handlerMap.get(device.deviceType),
    ].flat();
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
    return handlers.filter((h) => h !== undefined).map((h) => h!);
  }
}
