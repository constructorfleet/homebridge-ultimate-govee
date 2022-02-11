import * as rgb2hsv from 'pure-color/convert/rgb2hsv';
import * as hsv2rgb from 'pure-color/convert/hsv2rgb';

export class ColorRGB {
  constructor(
    public red: number,
    public green: number,
    public blue: number,
  ) {
  }
}

export const KELVIN_MINIMUM = 2000;
export const KELVIN_MAXIMUM = 7100;
export const HUE_MINIMUM = 0;
export const HUE_MAXIMUM = 360;
export const SATURATION_MINIMUM = 0;
export const SATURATION_MAXIMUM = 100;

export const KELVIN_MAP = {
  2000: [255, 141, 11],
  2100: [255, 146, 29],
  2200: [255, 147, 44],
  2300: [255, 152, 54],
  2400: [255, 157, 63],
  2500: [255, 166, 69],
  2600: [255, 170, 77],
  2700: [255, 174, 84],
  2800: [255, 173, 94],
  2900: [255, 177, 101],
  3000: [255, 180, 107],
  3100: [255, 189, 111],
  3200: [255, 187, 120],
  3300: [255, 195, 124],
  3400: [255, 198, 130],
  3500: [255, 201, 135],
  3600: [255, 203, 141],
  3700: [255, 206, 146],
  3800: [255, 204, 153],
  3900: [255, 206, 159],
  4000: [255, 213, 161],
  4100: [255, 215, 166],
  4200: [255, 217, 171],
  4300: [255, 219, 175],
  4400: [255, 221, 180],
  4500: [255, 223, 184],
  4600: [255, 225, 188],
  4700: [255, 226, 192],
  4800: [255, 228, 196],
  4900: [255, 229, 200],
  5000: [255, 231, 204],
  5100: [255, 230, 210],
  5200: [255, 234, 211],
  5300: [255, 235, 215],
  5400: [255, 237, 218],
  5500: [255, 236, 224],
  5700: [255, 240, 228],
  5800: [255, 241, 231],
  5900: [255, 243, 234],
  6000: [255, 244, 237],
  6100: [255, 245, 240],
  6200: [255, 246, 243],
  6300: [255, 247, 247],
  6400: [255, 248, 251],
  6500: [255, 249, 253],
  6600: [254, 249, 255],
  6700: [252, 247, 255],
  6800: [249, 246, 255],
  6900: [247, 245, 255],
  7000: [245, 243, 255],
  7100: [243, 242, 255],
};

export const kelvinToRGB =
  (kelvin: number): [number, number, number] =>
    KELVIN_MAP[
      Math.max(
        Math.min(
          Math.round(kelvin / 100) * 100,
          7100,
        ),
        2000,
      )];

export const rgbToHSV =
  (red: number, green: number, blue: number): [number, number] =>
    rgb2hsv([red, green, blue]);

export const hsvToRGB =
  (hue: number, saturation: number): [number, number, number] =>
    hsv2rgb([hue, saturation, 100]);
