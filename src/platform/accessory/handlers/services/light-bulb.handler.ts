import { Characteristic, Service } from 'hap-nodejs';
import {
  BrightnessStateName,
  ColorRGBStateName,
  ColorTempStateName,
  Device,
  PowerStateName,
  RGBICLight,
  RGBICLightDevice,
  RGBLight,
  RGBLightDevice,
  WholeColorModeStateName,
} from '@constructorfleet/ultimate-govee';
import { ServiceHandler } from '../service.handler';
import { HandlerRegistry } from '../handler.registry';
import { ColorRGB, hsvToRGB, rgbToHSV } from '../../../../common';

@HandlerRegistry.forDevice(RGBLightDevice)
export class LightBulbHandler extends ServiceHandler<RGBLight> {
  readonly serviceType = Service.Lightbulb;
  readonly isPrimary: boolean = true;
  readonly handlers = {
    [PowerStateName]: [
      {
        characteristic: Characteristic.On,
        updateValue: (value) => value,
        onSet: (value) => value,
      },
    ],
    [BrightnessStateName]: [
      {
        characteristic: Characteristic.Brightness,
        updateValue: (value) => value,
        onSet: (value) => value,
      },
    ],
    [ColorTempStateName]: [
      {
        characteristic: Characteristic.ColorTemperature,
        configure: () => ({ minValue: 2000, maxValue: 9000 }),
        updateValue: (
          value,
          { characteristic }: { characteristic: Characteristic },
        ) =>
          value >= (characteristic.props.minValue ?? 2000) &&
          value <= (characteristic.props.maxValue ?? 9000)
            ? value
            : undefined,
        onSet: (value) => value,
      },
    ],
    [ColorRGBStateName]: [
      {
        characteristic: Characteristic.Hue,
        updateValue: (value) => {
          const { red, green, blue } = value;
          return red !== undefined && green !== undefined && blue !== undefined
            ? rgbToHSV(new ColorRGB(red, green, blue)).hue
            : undefined;
        },
        onSet: (value, service) => {
          const { red, green, blue } = hsvToRGB(
            value,
            (service.getCharacteristic(Characteristic.Saturation)
              .value as number) || 0,
          );
          return {
            red,
            green,
            blue,
          };
        },
      },
      {
        characteristic: Characteristic.Saturation,
        updateValue: (value) => {
          const { red, green, blue } = value;
          return red !== undefined && green !== undefined && blue !== undefined
            ? rgbToHSV(new ColorRGB(red, green, blue)).saturation
            : undefined;
        },
        onSet: (value, service) => {
          const { red, green, blue } = hsvToRGB(
            (service.getCharacteristic(Characteristic.Hue).value as number) ||
              0,
            value,
          );
          return {
            red,
            green,
            blue,
          };
        },
      },
    ],
  };
}

@HandlerRegistry.forDevice(RGBICLightDevice)
export class LightStripHandler extends ServiceHandler<RGBICLight> {
  readonly serviceType = Service.Lightbulb;
  readonly isPrimary: boolean = true;
  readonly handlers = {
    [PowerStateName]: [
      {
        characteristic: Characteristic.On,
        updateValue: (value) => value,
        onSet: (value) => value,
      },
    ],
    [BrightnessStateName]: [
      {
        characteristic: Characteristic.Brightness,
        updateValue: (value) => value,
        onSet: (value) => value,
      },
    ],
    [ColorTempStateName]: [
      {
        characteristic: Characteristic.ColorTemperature,
        configure: () => ({ minValue: 2000, maxValue: 9000 }),
        updateValue: (
          value,
          {
            device,
            characteristic,
          }: { device: Device<RGBICLight>; characteristic: Characteristic },
        ) => {
          const color = (device as Device<RGBICLight>)?.state(
            WholeColorModeStateName,
          )?.value;
          if (color === undefined) {
            return undefined;
          }
          const { red, green, blue } = color;
          if (red === 255 && green === 255 && blue === 255) {
            if (
              value >= (characteristic.props.minValue ?? 2000) &&
              value <= (characteristic.props.minValue ?? 9000)
            ) {
              return value;
            }
          }
          return undefined;
        },
        onSet: (value) => value,
      },
    ],
    [WholeColorModeStateName]: [
      {
        characteristic: Characteristic.Hue,
        updateValue: (value) => {
          const { red, green, blue } = value;
          return red !== undefined && green !== undefined && blue !== undefined
            ? rgbToHSV(new ColorRGB(red, green, blue)).hue
            : undefined;
        },
        onSet: (value, { service }) => {
          const { red, green, blue } = hsvToRGB(
            value,
            (service.getCharacteristic(Characteristic.Saturation)
              .value as number) || 0,
          );
          return {
            red,
            green,
            blue,
          };
        },
      },
      {
        characteristic: Characteristic.Saturation,
        updateValue: (value) => {
          const { red, green, blue } = value;
          return red !== undefined && green !== undefined && blue !== undefined
            ? rgbToHSV(new ColorRGB(red, green, blue)).saturation
            : undefined;
        },
        onSet: (value, { service }) => {
          const { red, green, blue } = hsvToRGB(
            (service.getCharacteristic(Characteristic.Hue).value as number) ||
              0,
            value,
          );
          return {
            red,
            green,
            blue,
          };
        },
      },
    ],
  };
}
