import {
  Device,
  DeviceStatesType,
  Optional,
} from '@constructorfleet/ultimate-govee';
import { Service, Characteristic } from 'hap-nodejs';
import {
  CharacteristicHandler,
  CharacteristicHandlerFunctions,
  ServiceCharacteristicHandlers,
  ServiceName,
  SubServiceHandler as SubServiceHandlerType,
  ServiceType,
} from './handler.types';
import { Logger, Type, mixin } from '@nestjs/common';
import { API, PlatformAccessory, WithUUID } from 'homebridge';
import { InjectHomebridgeApi } from '../accessory.const';
import { Subscription } from 'rxjs';

const defaultName = <States extends DeviceStatesType>(device: Device<States>) =>
  device.name;

export const getServiceIdentifier = (
  deviceType: string,
  serviceType: WithUUID<Type<Service>>,
  subType?: string,
) => `${deviceType}.${serviceType}.${subType}`;

export abstract class ServiceHandler<States extends DeviceStatesType> {
  protected readonly logger: Logger = new Logger(this.constructor.name);
  abstract readonly handlers: ServiceCharacteristicHandlers<States>;
  abstract readonly serviceType: ServiceType;
  readonly name: ServiceName<States> = defaultName;
  readonly isPrimary: boolean = false;
  readonly subType: string | undefined = undefined;
  readonly subscriptions: Map<string, Subscription[]> = new Map();

  constructor(@InjectHomebridgeApi private readonly api: API) {}

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

  tearDown(accessory: PlatformAccessory, device: Device<States>) {
    const initializedKey = `${this.serviceType.UUID}${this.subType === undefined ? '' : this.subType}`;
    if (!accessory.context.initialized) {
      accessory.context.initialized = {};
    }
    accessory.context.initialized[initializedKey] = false;
    const service = accessory.services.find(
      (service) =>
        service.UUID === this.serviceType.UUID &&
        service.subtype === this.subType,
    );
    if (service === undefined) {
      return;
    }
    accessory.removeService(service);
    this.api.updatePlatformAccessories([accessory]);
    this.subscriptions.get(device.id)?.forEach((sub) => sub.unsubscribe());
  }

  setup(accessory: PlatformAccessory, device: Device<States>) {
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
      accessory.addService(newService);
    }
    const service = newService!;
    if (service.isPrimaryService !== this.isPrimary) {
      service.setPrimaryService(this.isPrimary);
    }
    const subscriptions: Subscription[] = [];
    Object.entries(this.handlers).forEach(([stateName, handlers]) => {
      const state = device.state(stateName);
      if (state === undefined) {
        logger.error(`No characteristic handlers for state ${stateName}`);
      }

      this.setProps(logger, device, service, handlers, state?.value);
      this.doUpdate(logger, device, service, handlers, state?.value);
      const sub = state?.subscribe((value) => {
        this.doUpdate(logger, device, service, handlers, value);
      });
      if (sub !== undefined) {
        subscriptions.push(sub);
      }

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
    this.subscriptions.set(device.id, subscriptions);
    accessory.context.initialized[initializedKey] = true;
    this.api.updatePlatformAccessories([accessory]);
  }
}

export const SubServiceHandler = <States extends DeviceStatesType>(
  deviceType: Device<States>,
  serviceType: ServiceType,
  subType: string,
  name: ServiceName<States>,
  characteristicHandlers: ServiceCharacteristicHandlers<States>,
): Type<SubServiceHandlerType<States>> => {
  const identifier = getServiceIdentifier(
    deviceType.deviceType,
    serviceType,
    subType,
  );
  class SubServiceHandlerMixin extends ServiceHandler<States> {
    static readonly identifier: string = identifier;
    readonly identifier: string = identifier;
    readonly handlers: ServiceCharacteristicHandlers<States> =
      characteristicHandlers;
    readonly name: ServiceName<States> = name;
    readonly serviceType: ServiceType = serviceType;
    readonly subType: string | undefined = subType;
  }

  return mixin(SubServiceHandlerMixin);
};
