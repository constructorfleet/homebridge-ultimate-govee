import {
  Device,
  DeviceStatesType,
  Optional,
} from '@constructorfleet/ultimate-govee';
import { Logger, Type, mixin } from '@nestjs/common';
import { Characteristic, Service } from 'hap-nodejs';
import { API, WithUUID } from 'homebridge';
import { Subscription } from 'rxjs';
import { InjectHomebridgeApi } from '../accessory.const';
import { GoveeAccessory } from '../govee.accessory';
import {
  CharacteristicHandler,
  CharacteristicHandlerFunctions,
  CharacteristicType,
  IsServiceEnabled,
  ServiceCharacteristicHandlers,
  ServiceName,
  ServiceType,
  SubServiceHandler as SubServiceHandlerType,
} from './handler.types';

const defaultName = <States extends DeviceStatesType>(
  accessory: GoveeAccessory<States>,
) => accessory.name;

export const getServiceIdentifier = (
  deviceType: string,
  serviceType: WithUUID<Type<Service>>,
  subType?: string,
) => `${deviceType}.${serviceType}.${subType}`;

export abstract class ServiceHandler<States extends DeviceStatesType> {
  protected readonly logger: Logger = new Logger(this.constructor.name);
  abstract readonly handlers: ServiceCharacteristicHandlers<States>;
  abstract readonly serviceType: ServiceType;
  readonly optionalCharacteristics: CharacteristicType[] | undefined;
  readonly name: ServiceName<States> | undefined;
  readonly isPrimary: boolean = false;
  readonly subType: string | undefined = undefined;
  readonly subscriptions: Map<string, Subscription[]> = new Map();
  readonly isEnabled: IsServiceEnabled<States> | undefined;

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
  ): CharacteristicHandler<CharacteristicType, unknown>[] {
    const filteredHandlers =
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
            logger.debug(
              `Service ${service.UUID} does not have characteristic ${handler.characteristic.name}`,
            );
            return false;
          }
          return true;
        })
        .map((handler) => handler!) ?? [];
    return Array.from(new Set(filteredHandlers).values());
  }

  private setProps<StateType, ServiceType extends WithUUID<Service>>(
    logger: Logger,
    accessory: GoveeAccessory<States>,
    service: ServiceType,
    handlers:
      | Optional<CharacteristicHandler<CharacteristicType, unknown>>[]
      | undefined,
    value: StateType,
  ) {
    this.filterHandlers(logger, service, handlers, 'configure')?.forEach(
      (handler) => {
        if (handler.configure === undefined) {
          return;
        }

        const char = service.getCharacteristic(handler.characteristic);
        const charProps =
          value !== undefined
            ? handler.configure(value, {
                accessory,
                service,
                characteristic: char,
              })
            : undefined;

        if (charProps === undefined) {
          return;
        }
        char.setProps(charProps);
      },
    );
  }

  private doUpdate<StateType, ServiceType extends WithUUID<Service>>(
    logger: Logger,
    accessory: GoveeAccessory<States>,
    service: ServiceType,
    handlers: CharacteristicHandler<CharacteristicType, unknown>[] | undefined,
    value: StateType,
  ) {
    this.filterHandlers(logger, service, handlers)?.forEach((handler) => {
      const char = service.getCharacteristic(handler.characteristic);
      const charValue =
        value !== undefined
          ? handler.updateValue(value, {
              accessory,
              service,
              characteristic: char,
            })
          : undefined;

      if (charValue === undefined) {
        return;
      }
      logger.log(
        `Updating characteristic ${service.name} ${service.subtype} ${handler.characteristic.name} to ${charValue}`,
      );
      char.updateValue(charValue);
    });
  }

  private setServiceName(
    goveeAccessory: GoveeAccessory<States>,
    service: Service,
  ) {
    const serviceName = this.name
      ? this.name(goveeAccessory, this.subType)
      : defaultName(goveeAccessory);
    service.name = serviceName;
    service.displayName = serviceName;
    [...service.characteristics, ...service.optionalCharacteristics]
      .filter(
        (char) =>
          char.UUID === Characteristic.Name.UUID ||
          char.UUID === Characteristic.ConfiguredName.UUID,
      )
      .forEach((char) => {
        char.updateValue(serviceName);
      });
  }

  tearDown(goveeAccessory: GoveeAccessory<States>): Service | undefined {
    const { accessory, device } = goveeAccessory;
    const initializedKey = `${this.serviceType.UUID}--${this.subType === undefined ? '' : this.subType}`;
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
    return service;
  }

  setup(goveeAccessory: GoveeAccessory<States>): Service | undefined {
    const { accessory, device } = goveeAccessory;
    const initializedKey = `${this.serviceType.UUID}--${this.subType === undefined ? '' : this.subType}`;
    const logger = new Logger(`${ServiceHandler.name} - ${device.name}`);
    if (!accessory.context.initialized) {
      accessory.context.initialized = {};
    }
    if (
      accessory.context.initialized &&
      accessory.context.initialized[initializedKey] === true
    ) {
      const service = accessory.services.find(
        (s) => s.UUID === this.serviceType.UUID && s.subtype === this.subType,
      );
      if (service !== undefined) {
        this.setServiceName(goveeAccessory, service);
        return service;
      }
    }
    let newService: Service | undefined = accessory.services.find(
      (s) => s.UUID === this.serviceType.UUID && s.subtype === this.subType,
    );
    if (newService === undefined) {
      newService = new this.serviceType(
        this.name
          ? this.name(goveeAccessory, this.subType)
          : defaultName(goveeAccessory),
        this.subType,
      );
      if (this.optionalCharacteristics) {
        this.optionalCharacteristics.forEach((char) =>
          newService!.addOptionalCharacteristic(char),
        );
      }
      accessory.addService(newService);
    }
    const service = newService!;
    this.setServiceName(goveeAccessory, service);

    if (service.isPrimaryService !== this.isPrimary) {
      service.setPrimaryService(this.isPrimary);
    }
    if (this.subType === 'light-9') {
      service.getCharacteristic(Characteristic.On);
    }
    const subscriptions: Subscription[] = [];
    Object.entries(this.handlers).forEach(([stateName, handlers]) => {
      const state = device.state(stateName);
      if (state === undefined) {
        logger.error(`No characteristic handlers for state ${stateName}`);
      }

      this.setProps(logger, goveeAccessory, service, handlers, state?.value);
      const sub = state?.subscribe((value) => {
        this.setProps(logger, goveeAccessory, service, handlers, value);
        this.doUpdate(logger, goveeAccessory, service, handlers, value);
      });
      if (sub !== undefined) {
        subscriptions.push(sub);
      }

      this.filterHandlers(logger, service, handlers, 'onSet')?.forEach(
        (handler) => {
          const char = service.getCharacteristic(handler.characteristic)!;
          logger.debug(
            `Assigning onSet handler ${service.name} ${service.subtype} ${handler.characteristic.name} to characteristic ${handler.characteristic.name}`,
          );
          char.onSet((value) => {
            const stateValue =
              value !== undefined
                ? handler.onSet!(value, {
                    accessory: goveeAccessory,
                    service,
                    characteristic: char,
                  })
                : undefined;
            if (stateValue === undefined) {
              return;
            }

            logger.debug(
              `Issuing state ${stateValue} to ${service.name} ${service.subtype} ${stateName}`,
            ),
              state?.setState(stateValue);
          });
        },
      );
    });
    this.subscriptions.set(device.id, subscriptions);
    accessory.context.initialized[initializedKey] = true;
    this.api.updatePlatformAccessories([accessory]);
    return newService;
  }
}

export const SubServiceHandler = <States extends DeviceStatesType>(
  deviceType: Device<States>,
  serviceType: ServiceType,
  subType: string,
  name: ServiceName<States>,
  characteristicHandlers: ServiceCharacteristicHandlers<States>,
  isEnabled: IsServiceEnabled<States>,
  isPrimary: boolean,
  ...optionalCharacteristics: CharacteristicType[]
): Type<SubServiceHandlerType<States>> => {
  const identifier = getServiceIdentifier(
    deviceType.deviceType,
    serviceType,
    subType,
  );
  class SubServiceHandlerMixin extends ServiceHandler<States> {
    readonly isPrimary: boolean = isPrimary;
    readonly identifier: string = identifier;
    readonly handlers: ServiceCharacteristicHandlers<States> =
      characteristicHandlers;
    readonly name: ServiceName<States> = name;
    readonly serviceType: ServiceType = serviceType;
    readonly subType: string | undefined = subType;
    readonly isEnabled: IsServiceEnabled<States> = isEnabled;
    readonly optionalCharacteristics: CharacteristicType[] =
      optionalCharacteristics;
  }

  return mixin(SubServiceHandlerMixin);
};
