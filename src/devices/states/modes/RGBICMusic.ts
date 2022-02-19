/*
Command:
[ Uint8Array [ 51, 5, 19, 3, 99, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 186 ],
  Uint8Array [ 170, 5, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 174 ] ]
 */

/*
Report:
[ Uint8Array [ 51, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 54 ],
  Uint8Array [ 170, 5, 19, 3, 99, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 35 ] ]
 */

import {ColorRGB} from '../../../util/colorUtils';
import {RGBMusicMode} from './RGBMusic';

export enum ColorMode {
  AUTOMATIC = 0x00,
  SPECIFIED = 0x01,
}

export enum IntensityMode {
  DYNAMIC = 0x00,
  CALM = 0x01,
}

export class RGBICMusicMode extends RGBMusicMode {
  public modeIdentifier = 19;
  public intensity: IntensityMode = IntensityMode.DYNAMIC;
  public colorMode: ColorMode = ColorMode.AUTOMATIC;
  public specifiedColor: ColorRGB = new ColorRGB(0, 0, 0);


  populateFromCommandValues(commandValues: number[]): ThisType<this> {
    this.intensity = commandValues[0];
    this.colorMode = commandValues[1];
    this.specifiedColor.red = commandValues[2];
    this.specifiedColor.green = commandValues[3];
    this.specifiedColor.blue = commandValues[4];
    return this;
  }

  extraCommandValues(): number[] {
    return [
      this.intensity,
      this.colorMode,
      this.specifiedColor.red,
      this.specifiedColor.green,
      this.specifiedColor.blue,
    ];
  }
}