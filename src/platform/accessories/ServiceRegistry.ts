import {Provider} from '@nestjs/common/interfaces/modules/provider.interface';
import {Constructor} from '@nestjs/common/utils/merge-with-values.util';
import {AccessoryService} from './services/AccessoryService';
import {ModuleRef} from '@nestjs/core';
import {GoveeDevice} from '../../devices/GoveeDevice';
import {State} from '../../devices/states/State';
import {Lock} from 'async-await-mutex-lock';

export declare type ServiceCreator<IdentifierType> = (state: GoveeDevice) => Promise<AccessoryService<IdentifierType>[]>;

export class StateAccessory<StateType extends typeof State> {
  constructor(
    public state: StateType,
    public ctor: Constructor<AccessoryService<unknown>>,
  ) {
  }
}

export class ServiceRegistry {
  // @ts-ignore
  private static readonly services: StateAccessory<typeof State>[] = [];

  private static readonly deviceServices: Map<GoveeDevice, AccessoryService<unknown>[]> =
    new Map<GoveeDevice, AccessoryService<unknown>[]>();

  private static readonly serviceLock: Lock<void> = new Lock<void>();

  static getServices(): Provider {
    return {
      provide: AccessoryService,
      useFactory: async (moduleRef: ModuleRef): Promise<ServiceCreator<unknown>> =>
        async (device: GoveeDevice): Promise<AccessoryService<unknown>[]> => {
          let deviceServices = this.deviceServices.get(device);
          if (deviceServices !== undefined) {
            return deviceServices;
          }
          const ctors = this.services
            .filter(
              (state) => {
                return device instanceof state.state;
              },
            )
            .map((state) => {
              return state.ctor;
            });
          if (!ctors || ctors.length === 0) {
            return [];
          }
          deviceServices = await Promise.all(
            ctors.filter(
              (ctor) => ctor !== undefined,
            ).map(
              (ctor) => moduleRef.create(ctor as Constructor<AccessoryService<unknown>>),
            ),
          );
          this.deviceServices.set(device, deviceServices);

          return deviceServices;
        },
      inject: [ModuleRef],
    };
  }

  static register<IdentifierType, T extends Constructor<AccessoryService<IdentifierType>>>(
    ...states: (typeof State)[]
  ): (ctor: T) => void {
    return (ctor: T) => {
      for (let i = 0; i < states.length; i++) {
        const state = states[i];
        ServiceRegistry.services.push(
          new StateAccessory(state, ctor),
        );
      }

      return ctor;
    };
  }
}
