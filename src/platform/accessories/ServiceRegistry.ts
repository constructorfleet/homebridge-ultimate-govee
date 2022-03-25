import {Provider} from '@nestjs/common/interfaces/modules/provider.interface';
import {Constructor} from '@nestjs/common/utils/merge-with-values.util';
import {AccessoryService} from './services/AccessoryService';
import {ModuleRef} from '@nestjs/core';
import {GoveeDevice} from '../../devices/GoveeDevice';
import {State} from '../../devices/states/State';
import {Lock} from 'async-await-mutex-lock';

export declare type ServiceCreator<IdentifierType> = (state: GoveeDevice) => Promise<AccessoryService<IdentifierType>[]>;

export class StateAccessory {
  constructor(
    public state: typeof State,
    public ctor: Constructor<AccessoryService<unknown>>,
  ) {
  }
}

export class ServiceRegistry {
  private static readonly services: StateAccessory[] = [];

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
                if (state.state.name === 'GoveeRGBICLight') {
                  console.log(device, state.state);
                }
                return device instanceof state.state;
              },
            )
            .map((state) => {
              console.log('Found', state.ctor);
              return state.ctor;
            });
          console.log(device, ctors.map((x) => x.name));
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
        const stateName = state.name;
        console.log('registerService', states[i], ctor);
        ServiceRegistry.services
          .filter(
            (stateAccessory: StateAccessory) => {
              console.log('Name', stateAccessory.state.name, stateName);
              return stateAccessory.state.name === stateName;
            },
          )
          .forEach(
            (stateAccessory: StateAccessory) => stateAccessory.state = state,
          );
        ServiceRegistry.services.push(
          new StateAccessory(state, ctor),
        );
      }

      return ctor;
    };
  }
}