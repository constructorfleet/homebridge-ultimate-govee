import {
  DeviceState,
  ModeStateName,
  Optional,
  RGBICActiveState,
  RGBICLightDevice,
  SegmentColorModeStateName,
} from '@constructorfleet/ultimate-govee';
import {
  Segment,
  SegmentColorModeState,
} from '@constructorfleet/ultimate-govee/dist/domain/devices/impl/lights/rgbic/rgbic-light.modes';
import { Injectable } from '@nestjs/common';
import { Characteristic, Service } from 'hap-nodejs';
import { ColorRGB, hsvToRGB, rgbToHSV } from '../../../../common';
import { GoveeAccessory } from '../../govee.accessory';
import { SubServiceHandlerFactory } from '../handler.factory';
import { HandlerRegistry } from '../handler.registry';
import {
  CharacteristicType,
  IsServiceEnabled,
  ServiceCharacteristicHandlerFactory,
  ServiceName,
  ServiceSubTypes,
  ServiceType,
} from '../handler.types';

type SegmentsDevice = {
  [SegmentColorModeStateName]: Optional<DeviceState<string, any>>;
};

const getSegment = (subType?: string): number =>
  parseInt(subType?.split('-')?.slice(-1)?.at(0) ?? '-1');

const getLightSegment = (
  subType?: string,
  segments?: Segment[],
): Segment | undefined => {
  if (segments === undefined || subType === undefined) {
    return undefined;
  }
  return segments.find((segment) => segment.id === getSegment(subType));
};

const setLightSegment = (
  subType?: string,
  segments?: Segment[],
  segment?: Segment,
): Segment[] => {
  if (segments === undefined) {
    segments = [];
  }
  if (segment === undefined) {
    return segments;
  }
  const index = segments?.findIndex((seg) => seg.id === getSegment(subType));
  if (index === undefined || index < 0) {
    segments?.push(segment);
  } else {
    segments[index] = segment;
  }

  return segments;
};

@HandlerRegistry.factoryFor(RGBICLightDevice)
@Injectable()
export class RGBICSegmentFactory extends SubServiceHandlerFactory<SegmentsDevice> {
  protected serviceType: ServiceType = Service.Lightbulb;
  protected readonly isPrimary: boolean = false;
  protected readonly optionalCharacteristics: CharacteristicType[] = [
    Characteristic.ConfiguredName,
  ];
  protected handlers: ServiceCharacteristicHandlerFactory<SegmentsDevice> = (
    accessory: GoveeAccessory<SegmentsDevice>,
    subType?: string,
  ) => ({
    [SegmentColorModeStateName]: [
      {
        characteristic: Characteristic.On,
        updateValue: (value?: Segment[]) => {
          if (
            accessory.device.state<RGBICActiveState>(ModeStateName)?.name !==
            SegmentColorModeState.name
          ) {
            return false;
          }
          const segment = getLightSegment(subType, value);
          if (!segment) {
            return undefined;
          }
          return (segment.brightness ?? 0) > 0;
        },
        onSet: (value) => {
          const segments = accessory.device.state<SegmentColorModeState>(
            SegmentColorModeStateName,
          )?.value;
          let segment = getLightSegment(subType, segments);
          if (!segment) {
            segment = {
              id: getSegment(subType),
              brightness: value ? 100 : 0,
            };
          } else {
            segment.brightness = value ? 100 : 0;
          }
          return setLightSegment(subType, segments, segment);
        },
      },
      {
        characteristic: Characteristic.Brightness,
        updateValue: (value?: Segment[]) => {
          if (
            accessory.device.state<RGBICActiveState>(ModeStateName)?.name !==
            SegmentColorModeState.name
          ) {
            return false;
          }
          const segment = getLightSegment(subType, value);
          if (!segment) {
            return undefined;
          }
          return segment.brightness;
        },
        onSet: (value) => {
          const segments = accessory.device.state<SegmentColorModeState>(
            SegmentColorModeStateName,
          )?.value;
          let segment = getLightSegment(subType, segments);
          if (!segment) {
            segment = {
              id: getSegment(subType),
              brightness: value as number,
            };
          } else {
            segment.brightness = value as number;
          }
          return setLightSegment(subType, segments, segment);
        },
      },
      {
        characteristic: Characteristic.Hue,
        updateValue: (value?: Segment[]) => {
          if (
            accessory.device.state<RGBICActiveState>(ModeStateName)?.name !==
            SegmentColorModeState.name
          ) {
            return false;
          }
          const segment = getLightSegment(subType, value);
          if (segment?.color === undefined) {
            return undefined;
          }
          return rgbToHSV(
            new ColorRGB(
              segment.color.red,
              segment.color.green,
              segment.color.blue,
            ),
          ).hue;
        },
        onSet: (value, { service }) => {
          const segments = accessory.device.state<SegmentColorModeState>(
            SegmentColorModeStateName,
          )?.value;
          let segment = getLightSegment(subType, segments);
          if (!segment) {
            segment = {
              id: getSegment(subType),
              color: hsvToRGB(
                value as number,
                service.getCharacteristic(Characteristic.Saturation)
                  .value as number,
              ),
            };
          } else {
            segment.color = hsvToRGB(
              value as number,
              service.getCharacteristic(Characteristic.Saturation)
                .value as number,
            );
          }
          return setLightSegment(subType, segments, segment);
        },
      },
      {
        characteristic: Characteristic.Saturation,
        updateValue: (value?: Segment[]) => {
          if (
            accessory.device.state<RGBICActiveState>(ModeStateName)?.name !==
            SegmentColorModeState.name
          ) {
            return false;
          }
          const segment = getLightSegment(subType, value);
          if (segment?.color === undefined) {
            return undefined;
          }
          return rgbToHSV(
            new ColorRGB(
              segment.color.red,
              segment.color.green,
              segment.color.blue,
            ),
          ).saturation;
        },
        onSet: (value, { service }) => {
          const segments = accessory.device.state<SegmentColorModeState>(
            SegmentColorModeStateName,
          )?.value;
          let segment = getLightSegment(subType, segments);
          if (!segment) {
            segment = {
              id: getSegment(subType),
              color: hsvToRGB(
                service.getCharacteristic(Characteristic.Hue).value as number,
                value as number,
              ),
            };
          } else {
            segment.color = hsvToRGB(
              service.getCharacteristic(Characteristic.Hue).value as number,
              value as number,
            );
          }
          return setLightSegment(subType, segments, segment);
        },
      },
    ],
  });
  isEnabled: IsServiceEnabled<SegmentsDevice> = (
    accessory: GoveeAccessory<SegmentsDevice>,
    subType?: string,
  ) => {
    this.logger.warn({
      subType,
      device: accessory.device.id,
      enabled: accessory.shouldShowSegments,
    });
    return accessory.shouldShowSegments;
  };
  protected possibleSubTypes: ServiceSubTypes<SegmentsDevice> = (
    _: GoveeAccessory<SegmentsDevice>,
  ) => new Array(30).fill(0).map((_, idx) => `segment-${idx}`);
  protected name: ServiceName<SegmentsDevice> = (
    accessory: GoveeAccessory<SegmentsDevice>,
    subType?: string,
  ) => {
    this.logger.warn({
      subType,
      device: accessory.device.id,
      name: `Segment ${getSegment(subType)}`,
    });
    if (subType === undefined) {
      return 'Unknown';
    }

    const segmentNumber = getSegment(subType);
    return `Segment ${segmentNumber}}`;
  };
}
