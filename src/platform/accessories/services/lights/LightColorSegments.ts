import {Inject} from '@nestjs/common';
import {PLATFORM_CHARACTERISTICS, PLATFORM_SERVICES, SEGMENT_COUNT} from '../../../../util/const';
import {Characteristic, CharacteristicValue, Service, WithUUID} from 'homebridge';
import {GoveeDevice} from '../../../../devices/GoveeDevice';
import {EventEmitter2} from '@nestjs/event-emitter';
import {DeviceCommandEvent} from '../../../../core/events/devices/DeviceCommand';
import {LoggingService} from '../../../../logging/LoggingService';
import {hsvToRGB, kelvinToRGB, rgbToHSV} from '../../../../util/colorUtils';
import {ServiceRegistry} from '../../ServiceRegistry';
import {DeviceColorSegmentTransition} from '../../../../core/structures/devices/transitions/DeviceColorSegmentTransition';
import {LightService} from '../LightService';
import {ColorSegmentsState} from '../../../../devices/states/ColorSegments';
import {BrightnessState} from '../../../../devices/states/Brightness';
import {DeviceBrightnessTransition} from '../../../../core/structures/devices/transitions/DeviceBrightnessTransition';

@ServiceRegistry.register
export class LightColorSegments extends LightService {
  protected readonly ServiceType: WithUUID<typeof Service> = this.SERVICES.Lightbulb;
  protected readonly ServiceSubType?: string[] = new Array<string>(SEGMENT_COUNT)
    .fill('Segment')
    .map(
      (subType, idx) => `${subType} ${idx + 1}`,
    );

  protected readonly PrimaryService: boolean = false;

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
    return Reflect.has(device, 'colorSegments');
  }

  protected updateServiceCharacteristics(
    service: Service,
    device: GoveeDevice,
  ) {
    const segmentIndex = parseInt(service.subtype?.split(' ')[1] || '0') - 1;
    if (segmentIndex < 0) {
      return;
    }
    const segmentColor = (device as unknown as ColorSegmentsState).colorSegments[segmentIndex];

    service
      .getCharacteristic(this.CHARACTERISTICS.On)
      .updateValue(
        segmentColor?.red > 0 &&
        segmentColor?.green > 0 &&
        segmentColor?.blue > 0 &&
        (device as unknown as BrightnessState).brightness || 0 > 0,
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
    service
      .getCharacteristic(this.CHARACTERISTICS.Hue)
      .onSet(
        async (value: CharacteristicValue) =>
          await this.emitAsync(
            new DeviceCommandEvent(
              new DeviceColorSegmentTransition(
                device.deviceId,
                segmentIndex,
                hsvToRGB(
                  value as number || 0,
                  service.getCharacteristic(
                    this.CHARACTERISTICS.Saturation,
                  ).value as number || 0,
                ),
              ),
            ),
          ),
      );
    service
      .getCharacteristic(this.CHARACTERISTICS.Saturation)
      .onSet(
        async (value: CharacteristicValue) =>
          await this.emitAsync(
            new DeviceCommandEvent(
              new DeviceColorSegmentTransition(
                device.deviceId,
                segmentIndex,
                hsvToRGB(
                  service.getCharacteristic(
                    this.CHARACTERISTICS.Hue,
                  ).value as number || 0,
                  value as number || 0,
                ),
              ),
            ),
          ),
      );
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
              new DeviceColorSegmentTransition(
                device.deviceId,
                segmentIndex,
                color,
              ),
            ),
          );
        },
      );
  }
}