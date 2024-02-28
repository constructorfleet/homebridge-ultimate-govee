/* eslint-disable @typescript-eslint/no-explicit-any */
import { Service, Characteristic, CharacteristicValue } from 'hap-nodejs';
import { Device } from '@constructorfleet/ultimate-govee';
import { Type, mixin } from '@nestjs/common';
import { ClassConstructor } from 'class-transformer';
import { CharacteristicProps, PartialAllowingNull, WithUUID } from 'homebridge';
import { Subscription } from 'rxjs';
import { Optional } from '@constructorfleet/ultimate-govee/dist/common';

export type OptionalChar = Characteristic | undefined;

export type GoveeService = {
  /* trunk-ignore(eslint/@typescript-eslint/naming-convention) */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  get UUID(): string;
  get isPrimary(): boolean;
  get deviceStates(): string[];
  get device(): Device;
  update(device: Device);
  setStates();
  subscribeToState<CharacteristicType extends WithUUID<Type<Characteristic>>>(
    state: string,
    characteristic: CharacteristicType | CharacteristicType[],
    handler?: (stateValue) => CharacteristicValue | undefined,
  ): Subscription | undefined;
  setState<
    CharacteristicType extends WithUUID<Type<Characteristic>>,
    StateValue,
  >(
    characteristic: CharacteristicType,
    state: string,
    handler?: (charValue: CharacteristicValue) => StateValue | undefined,
  );
  setCharacteristicProps<
    CharacteristicType extends WithUUID<Type<Characteristic>>,
    StateValue,
  >(
    characteristic: CharacteristicType | CharacteristicType[],
    state: string,
    handler: (
      value: StateValue,
    ) => PartialAllowingNull<CharacteristicProps> | undefined,
  ): Subscription | undefined;
} & Service;

// eslint-disable-next-line @typescript-eslint/ban-types
export type GoveeServiceConstructor<TService extends Service> = {
  new (device: Device): TService & GoveeService;
};

export const GoveeService = <TService extends WithUUID<Service>>(
  serviceType: ClassConstructor<TService>,
  isPrimary: boolean = false,
  ...deviceStates: string[]
): GoveeServiceConstructor<TService> => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  class ServiceMixIn extends serviceType {
    readonly isPrimary: boolean = isPrimary;
    readonly deviceStates: string[];
    readonly subscriptions: Subscription[] = [];
    protected device?: Device = undefined;

    constructor(device: Device) {
      super(device.name);
      this.deviceStates = deviceStates;
      this.update(device);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
    update(device: Device) {
      // if (this.device === device) {
      //   console.error('Device is the same');
      //   return;
      // }
      while (this.subscriptions.length > 0) {
        this.subscriptions.pop()?.unsubscribe();
      }
      this.setStates();
      this.updateCharacterististics();
      this.subscriptions.push(
        device.subscribe(() => {
          this.updateCharacterististics();
        }),
      );
      // this.subscriptions.push(...this.updateCharacterististics().filter((sub) => sub !== undefined).map((sub) => sub!));
    }

    setStates() {}

    updateCharacterististics(): Optional<Subscription>[] {
      return [];
    }

    subscribeToState<CharacteristicType extends WithUUID<Type<Characteristic>>>(
      state: string,
      characteristic: CharacteristicType | CharacteristicType[],
      handler?: (stateValue) => CharacteristicValue,
    ): Subscription | undefined {
      console.dir({
        stateName: state,
        id: this.device?.id,
        state: this.device?.state(state)?.value,
      });
      const value = this.device?.state(state)?.value;
      if (value === undefined) {
        return;
      }
      (Array.isArray(characteristic)
        ? characteristic
        : [characteristic]
      ).forEach((char) =>
        this.getCharacteristic(char).updateValue(
          handler !== undefined ? handler(value) : value,
        ),
      );
      // return this.device?.state(state)?.v(
      //   (value) => {
      //     if (value !== undefined) {
      //       (Array.isArray(characteristic) ? characteristic : [ characteristic ]).forEach(
      //         (char) =>
      //           this.getCharacteristic(char).updateValue(handler !== undefined
      //             ? handler(value)
      //             : value));
      //     }
      //   });
    }

    setState<
      CharacteristicType extends WithUUID<Type<Characteristic>>,
      StateValue,
    >(
      characteristic: CharacteristicType,
      state: string,
      handler?: (charValue: CharacteristicValue) => StateValue,
    ) {
      this.getCharacteristic(characteristic)
        .removeOnSet()
        .onSet((value) => {
          if (value !== undefined) {
            this.device
              ?.state(state)
              ?.setState(handler !== undefined ? handler(value) : value);
          }
        });
    }

    setCharacteristicProps<
      CharacteristicType extends WithUUID<Type<Characteristic>>,
      StateValue,
    >(
      characteristic: CharacteristicType | CharacteristicType[],
      state: string,
      handler: (value: StateValue) => PartialAllowingNull<CharacteristicProps>,
    ): Subscription | undefined {
      const value = this.device?.state(state)?.value;
      if (value === undefined) {
        return;
      }
      (Array.isArray(characteristic)
        ? characteristic
        : [characteristic]
      ).forEach((char) =>
        this.getCharacteristic(char).setProps(handler(value)),
      );
      // return this.device?.state(state)?.subscribe(
      //   (value) => {
      //     if (value !== undefined) {
      //       (Array.isArray(characteristic) ? characteristic : [ characteristic ])
      //         .forEach(
      //           (char) => this.getCharacteristic(char).setProps(handler(value))
      //         );
      //     }
      //   }
      // );
    }
  }

  return mixin(ServiceMixIn) as unknown as GoveeServiceConstructor<TService>;
};
