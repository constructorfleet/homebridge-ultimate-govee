import {AccessoryService} from '../AccessoryService';
import {Inject, Injectable} from '@nestjs/common';
import {PLATFORM_CHARACTERISTICS, PLATFORM_SERVICES} from '../../../../util/const';
import {Characteristic, CharacteristicValue, Service, WithUUID} from 'homebridge';
import {GoveeDevice} from '../../../../devices/GoveeDevice';
import {EventEmitter2} from '@nestjs/event-emitter';
import {DeviceCommandEvent} from '../../../../core/events/devices/DeviceCommand';
import {LoggingService} from '../../../../logging/LoggingService';
import {DeviceColorTransition} from '../../../../core/structures/devices/transitions/DeviceColorTransition';
import {kelvinToRGB} from '../../../../util/colorUtils';

@Injectable()
export class ColorTemperature extends AccessoryService {
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
    return Reflect.has(device, 'colorTemperature');
  }

  protected initializeServiceCharacteristics(
    service: Service,
    device: GoveeDevice,
  ) {
    service
      .getCharacteristic(this.CHARACTERISTICS.ColorTemperature)
      .onSet(
        async (value: CharacteristicValue) =>
          await this.emitAsync(
            new DeviceCommandEvent(
              new DeviceColorTransition(
                device.deviceId,
                kelvinToRGB(value as number || 0),
              ),
            ),
          ),
      );
  }
}