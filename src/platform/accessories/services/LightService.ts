import {AccessoryService} from './AccessoryService';
import {Inject, Injectable} from '@nestjs/common';
import {PLATFORM_CHARACTERISTICS, PLATFORM_SERVICES} from '../../../util/const';
import {Characteristic, CharacteristicValue, Service, WithUUID} from 'homebridge';
import {GoveeDevice} from '../../../devices/GoveeDevice';
import {ActiveState} from '../../../devices/states/Active';
import {EventEmitter2} from '@nestjs/event-emitter';
import {DeviceCommandEvent} from '../../../core/events/devices/DeviceCommand';
import {DeviceActiveTransition} from '../../../core/structures/devices/transitions/DeviceActiveTransition';
import {LoggingService} from '../../../logging/LoggingService';
import {BrightnessState} from '../../../devices/states/Brightness';
import {DeviceBrightnessTransition} from '../../../core/structures/devices/transitions/DeviceBrightnessTransition';

@Injectable()
export class LightService extends AccessoryService {
  protected readonly ServiceType: WithUUID<typeof Service> = this.SERVICES.Lightbulb;

  constructor(
    eventEmitter: EventEmitter2,
    @Inject(PLATFORM_SERVICES) SERVICES: typeof Service,
    @Inject(PLATFORM_CHARACTERISTICS) CHARACTERISTICS: typeof Characteristic,
    log: LoggingService,
  ) {
    super(
      eventEmitter,
      SERVICES,
      CHARACTERISTICS,
      log,
    );
  }

  protected supports(device: GoveeDevice): boolean {
    return Reflect.has(device, 'brightness');
  }

  protected initializeServiceCharacteristics(
    service: Service,
    device: GoveeDevice,
  ) {
    service
      .getCharacteristic(this.CHARACTERISTICS.On)
      .updateValue((device as unknown as ActiveState).isActive ?? false)
      .onSet(
        async (value: CharacteristicValue) =>
          this.emit(
            new DeviceCommandEvent(
              new DeviceActiveTransition(
                device.deviceId,
                value as boolean,
              ),
            ),
          ),
      );
    service
      .getCharacteristic(this.CHARACTERISTICS.Brightness)
      .updateValue((device as unknown as BrightnessState).brightness || 0)
      .onSet(
        async (value: CharacteristicValue) =>
          await this.emitAsync(
            new DeviceCommandEvent(
              new DeviceBrightnessTransition(
                device.deviceId,
                value as number || 0,
              ),
            ),
          ),
      );
  }

  protected updateServiceCharacteristics(
    service: Service,
    device: GoveeDevice,
  ) {
    service
      .getCharacteristic(this.CHARACTERISTICS.On)
      .updateValue((device as unknown as ActiveState).isActive ?? false);
    service.getCharacteristic(this.CHARACTERISTICS.Brightness)
      .updateValue((device as unknown as BrightnessState).brightness ?? 0);
  }
}