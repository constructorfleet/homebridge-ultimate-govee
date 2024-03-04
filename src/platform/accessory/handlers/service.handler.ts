import {
  Device,
  DeviceStatesType,
  Optional,
} from '@constructorfleet/ultimate-govee';
import { Service, Characteristic } from 'hap-nodejs';
import {
  CharacteristicHandler,
  CharacteristicHandlerFunctions,
} from './characteristic.handler';
import { Logger, Type, mixin } from '@nestjs/common';
import { PlatformAccessory, WithUUID } from 'homebridge';
import { ClassConstructor } from 'class-transformer';

export abstract class ServiceHandler<
  States extends DeviceStatesType,
  TService extends WithUUID<Service>,
> {
  protected readonly logger: Logger = new Logger(this.constructor.name);
  abstract readonly handlers: Partial<
    Record<
      keyof States,
      CharacteristicHandler<WithUUID<Type<Characteristic>>, any>[]
    >
  >;
  abstract readonly serviceType: WithUUID<ClassConstructor<TService>>;
  readonly isPrimary: boolean = false;
  readonly link: boolean = false;
  readonly subType: string | undefined = undefined;

  private filterHandlers<ServiceType extends WithUUID<Service>>(
    logger: Logger,
    service: ServiceType,
    handlers:
      | Optional<
          CharacteristicHandler<WithUUID<Type<Characteristic>>, unknown>
        >[]
      | undefined,
    functionName?: CharacteristicHandlerFunctions,
  ): CharacteristicHandler<WithUUID<Type<Characteristic>>, unknown>[] {
    return (
      handlers
        ?.filter((handler) => {
          if (handler === undefined) {
            return false;
          }
          if (functionName !== undefined && !(functionName in handler)) {
            return false;
          }
          if (
            ![
              ...service.characteristics,
              ...service.optionalCharacteristics,
            ].find((char) => char.UUID === handler.characteristic.UUID)
          ) {
            logger.error(
              `Service ${service.UUID} does not have characteristic ${handler.characteristic.name}`,
            );
            return false;
          }
          return true;
        })
        .map((handler) => handler!) ?? []
    );
  }

  private setProps<StateType, ServiceType extends WithUUID<Service>>(
    logger: Logger,
    device: Device<States>,
    service: ServiceType,
    handlers:
      | Optional<
          CharacteristicHandler<WithUUID<Type<Characteristic>>, unknown>
        >[]
      | undefined,
    value: StateType,
  ) {
    this.filterHandlers(logger, service, handlers, 'configure')?.forEach(
      (handler) => {
        if (handler.configure === undefined) {
          return;
        }
        logger.debug(
          `Initializing characteristic properties for ${handler.characteristic.name}`,
        );
        const charProps =
          value !== undefined
            ? handler.configure(value, { device, service })
            : undefined;

        if (charProps === undefined) {
          return;
        }
        service.getCharacteristic(handler.characteristic).setProps(charProps);
      },
    );
  }

  private doUpdate<StateType, ServiceType extends WithUUID<Service>>(
    logger: Logger,
    device: Device<States>,
    service: ServiceType,
    handlers:
      | CharacteristicHandler<WithUUID<Type<Characteristic>>, unknown>[]
      | undefined,
    value: StateType,
  ) {
    this.filterHandlers(logger, service, handlers)?.forEach((handler) => {
      const charValue =
        value !== undefined
          ? handler.updateValue(value, { device, service })
          : undefined;

      if (charValue === undefined) {
        logger.warn(
          `Unable to calculate new characteristic ${handler.characteristic.name} value`,
        );
        return;
      }
      logger.debug(
        `Updating characteristic ${handler.characteristic.name} to ${charValue}`,
      );
      service.getCharacteristic(handler.characteristic).updateValue(charValue);
    });
  }

  setup(
    accessory: PlatformAccessory,
    device: Device<States>,
    updatePlatformAccessories?: (accessories: PlatformAccessory[]) => void,
  ) {
    const initializedKey = `${this.serviceType.UUID}${this.subType === undefined ? '' : this.subType}`;
    const logger = new Logger(`${ServiceHandler.name} - ${device.name}`);
    if (!accessory.context.initialized) {
      accessory.context.initialized = {};
    }
    if (
      accessory.context.initialized &&
      accessory.context.initialized[initializedKey] === true
    ) {
      logger.warn(
        `Accessory already initialized service ${this.serviceType.name}`,
      );
      return;
    }
    let newService: Service | undefined = accessory.services.find(
      (service) =>
        service.UUID === this.serviceType.UUID &&
        this.subType === service.subtype,
    );
    if (newService === undefined) {
      newService = new this.serviceType(device.name, this.subType);
      // if (this.link === true) {
      //   const primary = accessory.services.find((s) => s.isPrimaryService);
      //   if (primary) {
      //     primary.addLinkedService(newService);
      //   } else {
      //     accessory.context.linkedServices = [
      //       ...accessory.context.linkedServices ?? [],
      //       newService,
      //     ];
      //   }
      // } else {
      accessory.addService(newService);
      // }
    }
    const service = newService!;
    if (service.isPrimaryService !== this.isPrimary) {
      service.setPrimaryService(this.isPrimary);
      if (this.isPrimary) {
        while ((accessory.context.linkedServices ?? []).length > 0) {
          service.addLinkedService(accessory.context.linkedServices.pop());
        }
      }
    }
    Object.entries(this.handlers).forEach(([stateName, handlers]) => {
      const state = device.state(stateName);
      if (state === undefined) {
        logger.error(`No characteristic handlers for state ${stateName}`);
      }

      this.setProps(logger, device, service, handlers, state?.value);
      this.doUpdate(logger, device, service, handlers, state?.value);
      state?.subscribe((value) => {
        this.doUpdate(logger, device, service, handlers, value);
      });

      this.filterHandlers(logger, service, handlers, 'onSet')?.forEach(
        (handler) => {
          const char = service.getCharacteristic(handler.characteristic)!;
          logger.debug(
            `Assigning onSet handler to ${handler.characteristic.name} `,
          );
          char.onSet((value) => {
            const stateValue =
              value !== undefined
                ? handler.onSet!(value, { device, service })
                : undefined;
            if (stateValue === undefined) {
              logger.warn(
                `Unable to determine new value for state ${stateName}`,
              );
              return;
            }

            logger.debug(`Issuing state ${stateValue} to ${stateName} `);
            state?.setState(stateValue);
          });
        },
      );
    });
    accessory.context.initialized[initializedKey] = true;
    if (updatePlatformAccessories !== undefined) {
      updatePlatformAccessories([accessory]);
    }
  }
}

export type DynamicServiceHandlerOptions<
  States extends DeviceStatesType,
  TService extends WithUUID<Service>,
> = {
  handlers: Partial<
    Record<
      keyof States,
      CharacteristicHandler<WithUUID<Type<Characteristic>>, any>[]
    >
  >;
  serviceType: WithUUID<ClassConstructor<TService>>;
  isPrimary?: boolean;
};

export const DynamicServiceHandler = <
  States extends DeviceStatesType,
  TService extends WithUUID<Service>,
>(
  baseHandler: ClassConstructor<ServiceHandler<any, WithUUID<Service>>>,
  ...options: DynamicServiceHandlerOptions<States, TService>[]
): Type<ServiceHandler<States, TService>>[] => {
  return options.map((handlerOptions) => {
    class ServiceHandlerMixin extends baseHandler {
      readonly handlers: Partial<
        Record<
          keyof States,
          CharacteristicHandler<WithUUID<Type<Characteristic>>, any>[]
        >
      > = handlerOptions.handlers;
      readonly serviceType: WithUUID<ClassConstructor<TService>> =
        handlerOptions.serviceType;
      readonly isPrimary: boolean = handlerOptions.isPrimary === true;
    }

    return mixin(ServiceHandlerMixin);
  });
};

export type DynamicServiceHandler<
  States extends DeviceStatesType,
  TService extends WithUUID<Service>,
> = (device: Device<States>) => Type<ServiceHandler<States, TService>>[];
