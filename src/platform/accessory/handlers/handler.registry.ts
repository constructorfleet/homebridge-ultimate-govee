import { Injectable, Type } from '@nestjs/common';
import { Service } from 'hap-nodejs';
import { ServiceHandler } from './service.handler';
import { Device, Optional } from '@constructorfleet/ultimate-govee';
import { ModuleRef } from '@nestjs/core';
import { WithUUID } from 'homebridge';

@Injectable()
export class HandlerRegistry {
  private static handlerMap: Map<
    string,
    Type<ServiceHandler<any, WithUUID<Service>>>[]
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

  constructor(private readonly moduleRef: ModuleRef) {}

  for(device: Device): Optional<ServiceHandler<any, WithUUID<Service>>[]> {
    const tokens = HandlerRegistry.handlerMap.get(device.deviceType);
    if (tokens === undefined) {
      return undefined;
    }
    return tokens.map((token) => this.moduleRef.get(token));
  }
}
