import {AccessoryService} from '../AccessoryService';
import {Inject} from '@nestjs/common';
import {PLATFORM_CHARACTERISTICS, PLATFORM_SERVICES} from '../../../../util/const';
import {Characteristic, CharacteristicValue, Service, WithUUID} from 'homebridge';
import {GoveeDevice} from '../../../../devices/GoveeDevice';
import {EventEmitter2} from '@nestjs/event-emitter';
import {DeviceCommandEvent} from '../../../../core/events/devices/DeviceCommand';
import {LoggingService} from '../../../../logging/LoggingService';
import {kelvinToRGB, rgbToHSV} from '../../../../util/colorUtils';
import {ServiceRegistry} from '../../ServiceRegistry';
import {DeviceColorTemperatureTransition} from '../../../../core/structures/devices/transitions/DeviceColorTemperatureTransition';

@ServiceRegistry.register
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
    return Reflect.has(device, 'colorTemperatureChange');
  }

  protected updateServiceCharacteristics(
    service: Service,
    device: GoveeDevice,
  ) {
    service
      .getCharacteristic(this.CHARACTERISTICS.ColorTemperature)
      .onSet(
        async (value: CharacteristicValue) => {
          const color = kelvinToRGB(value as number || 0);
          const hueSaturation = rgbToHSV(color);
          service.getCharacteristic(this.CHARACTERISTICS.Hue)
            .updateValue(hueSaturation.hue);
          service.getCharacteristic(this.CHARACTERISTICS.Saturation)
            .updateValue(hueSaturation.saturation);
          await this.emitAsync(
            new DeviceCommandEvent(
              new DeviceColorTemperatureTransition(
                device.deviceId,
                color,
                value as number,
              ),
            ),
          );
        },
      );
  }
}