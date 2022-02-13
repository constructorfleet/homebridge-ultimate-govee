import {AccessoryService} from './AccessoryService';
import {Inject} from '@nestjs/common';
import {PLATFORM_CHARACTERISTICS, PLATFORM_SERVICES} from '../../../util/const';
import {Characteristic, CharacteristicValue, Service, WithUUID} from 'homebridge';
import {GoveeDevice} from '../../../devices/GoveeDevice';
import {EventEmitter2} from '@nestjs/event-emitter';
import {DeviceCommandEvent} from '../../../core/events/devices/DeviceCommand';
import {LoggingService} from '../../../logging/LoggingService';
import {BrightnessState} from '../../../devices/states/Brightness';
import {DeviceBrightnessTransition} from '../../../core/structures/devices/transitions/DeviceBrightnessTransition';
import {ServiceRegistry} from '../ServiceRegistry';
import {GoveeLight} from '../../../devices/GoveeLight';
import {GoveeRGBLight} from '../../../devices/GoveeRGBLight';
import {GoveeRGBICLight} from '../../../devices/GoveeRGBICLight';
import {DeviceOnOffTransition} from '../../../core/structures/devices/transitions/DeviceOnOffTransition';
import {OnOffState} from '../../../devices/states/OnOff';

@ServiceRegistry.register
export class LightService extends AccessoryService {
  protected readonly ServiceType: WithUUID<typeof Service> = this.SERVICES.Lightbulb;
  protected readonly ServiceSubTypes?: string[] = ['Light'];

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
    return device instanceof GoveeLight || device instanceof GoveeRGBLight || device instanceof GoveeRGBICLight;
  }

  protected updateServiceCharacteristics(
    service: Service,
    device: GoveeDevice,
  ) {
    service
      .getCharacteristic(this.CHARACTERISTICS.On)
      .updateValue((device as unknown as OnOffState).isOn ?? false)
      .onSet(
        async (value: CharacteristicValue) =>
          this.emit(
            new DeviceCommandEvent(
              new DeviceOnOffTransition(
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
}