import rgb2hsv from 'pure-color/convert/rgb2hsv';
import hsv2rgb from 'pure-color/convert/hsv2rgb';

export class ColorRGB {
  constructor(
      public red: number,
      public green: number,
      public blue: number,
  ) {
  }

  get hex(): string {
    return [this.red, this.green, this.blue]
        .map(x => x.toString(16).padStart(2, '0')).join('');
  }

  public update(color: ColorRGB) {
    this.red = color.red;
    this.green = color.green;
    this.blue = color.blue;
  }

  difference(color: ColorRGB): number {
    return Math.abs(this.red - color.red) + Math.abs(this.green - color.green) - Math.abs(this.blue - color.blue);
  }
}

export class HueSaturation {
  constructor(
      public hue: number,
      public saturation: number,
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
  2000: new ColorRGB(255, 141, 11),
  2100: new ColorRGB(255, 146, 29),
  2200: new ColorRGB(255, 147, 44),
  2300: new ColorRGB(255, 152, 54),
  2400: new ColorRGB(255, 157, 63),
  2500: new ColorRGB(255, 166, 69),
  2600: new ColorRGB(255, 170, 77),
  2700: new ColorRGB(255, 174, 84),
  2800: new ColorRGB(255, 173, 94),
  2900: new ColorRGB(255, 177, 101),
  3000: new ColorRGB(255, 180, 107),
  3100: new ColorRGB(255, 189, 111),
  3200: new ColorRGB(255, 187, 120),
  3300: new ColorRGB(255, 195, 124),
  3400: new ColorRGB(255, 198, 130),
  3500: new ColorRGB(255, 201, 135),
  3600: new ColorRGB(255, 203, 141),
  3700: new ColorRGB(255, 206, 146),
  3800: new ColorRGB(255, 204, 153),
  3900: new ColorRGB(255, 206, 159),
  4000: new ColorRGB(255, 213, 161),
  4100: new ColorRGB(255, 215, 166),
  4200: new ColorRGB(255, 217, 171),
  4300: new ColorRGB(255, 219, 175),
  4400: new ColorRGB(255, 221, 180),
  4500: new ColorRGB(255, 223, 184),
  4600: new ColorRGB(255, 225, 188),
  4700: new ColorRGB(255, 226, 192),
  4800: new ColorRGB(255, 228, 196),
  4900: new ColorRGB(255, 229, 200),
  5000: new ColorRGB(255, 231, 204),
  5100: new ColorRGB(255, 230, 210),
  5200: new ColorRGB(255, 234, 211),
  5300: new ColorRGB(255, 235, 215),
  5400: new ColorRGB(255, 237, 218),
  5500: new ColorRGB(255, 236, 224),
  5700: new ColorRGB(255, 240, 228),
  5800: new ColorRGB(255, 241, 231),
  5900: new ColorRGB(255, 243, 234),
  6000: new ColorRGB(255, 244, 237),
  6100: new ColorRGB(255, 245, 240),
  6200: new ColorRGB(255, 246, 243),
  6300: new ColorRGB(255, 247, 247),
  6400: new ColorRGB(255, 248, 251),
  6500: new ColorRGB(255, 249, 253),
  6600: new ColorRGB(254, 249, 255),
  6700: new ColorRGB(252, 247, 255),
  6800: new ColorRGB(249, 246, 255),
  6900: new ColorRGB(247, 245, 255),
  7000: new ColorRGB(245, 243, 255),
  7100: new ColorRGB(243, 242, 255),
};

export const rgbToKelvin =
    (rgbColor: ColorRGB): number =>
        parseInt(Object.entries(KELVIN_MAP)
            .map(
                (entry) => {
                  return {
                    temperature: entry[0],
                    color: entry[1],
                    difference: rgbColor.difference(entry[1]),
                  };
                },
            )
            .sort((d1, d2) => Math.abs(d1.difference - d2.difference))[0].temperature);

export const kelvinToRGB =
    (kelvin: number): ColorRGB =>
        KELVIN_MAP[
            Math.max(
                Math.min(
                    Math.round(kelvin / 100) * 100,
                    7100,
                ),
                2000,
            )];

export const rgbToHSV =
    (rgb: ColorRGB): HueSaturation => {
      const hsv = rgb2hsv([rgb.red, rgb.green, rgb.blue]);
      return new HueSaturation(
          hsv[0],
          hsv[1],
      );
    };

export const hsvToRGB =
    (hue: number, saturation: number): ColorRGB => {
      const rgb = hsv2rgb([hue, saturation, 100]);
      return new ColorRGB(
          rgb[0],
          rgb[1],
          rgb[2],
      );
    };
