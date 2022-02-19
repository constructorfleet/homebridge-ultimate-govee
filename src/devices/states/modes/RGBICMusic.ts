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

import {DeviceMode} from './DeviceMode';
import {DeviceState} from '../../../core/structures/devices/DeviceState';
import {getCommandCodes, getCommandValues} from '../../../util/opCodeUtils';
import {COMMAND_IDENTIFIER, REPORT_IDENTIFIER} from '../../../util/const';
import {ColorRGB} from '../../../util/colorUtils';

export enum MusicModeType {
  ENERGETIC = 0x05,
  SPECTRUM = 0x04,
  ROLLING = 0x06,
  RHYTHM = 0x03,
}

export enum ColorMode {
  AUTOMATIC = 0x00,
  SPECIFIED = 0x01,
}

export enum IntensityMode {
  DYNAMIC = 0x00,
  CALM = 0x01,
}

export class RGBICMusicMode extends DeviceMode {
  public modeIdentifier = 19;
  public musicModeType: MusicModeType = MusicModeType.ENERGETIC;
  public sensitivity = 0;
  public intensity: IntensityMode = IntensityMode.DYNAMIC;
  public colorMode: ColorMode = ColorMode.AUTOMATIC;
  public specifiedColor: ColorRGB = new ColorRGB(0, 0, 0);


  public parse(deviceState: DeviceState): ThisType<this> {
    const commandValues = getCommandValues(
      [
        REPORT_IDENTIFIER,
        ...this.commandIdentifiers,
      ],
      deviceState.commands,
    );

    if (commandValues?.length === 1) {
      const values = commandValues[0];
      this.musicModeType = values[0];
      this.sensitivity = values[1];
      this.intensity = values[2];
      this.colorMode = values[3];
      this.specifiedColor.red = values[4];
      this.specifiedColor.green = values[5];
      this.specifiedColor.blue = values[6];
    }

    return this;
  }

  public musicChange(): number[] {
    return getCommandCodes(
      COMMAND_IDENTIFIER,
      this.commandIdentifiers,
      this.musicModeType,
      this.sensitivity,
      this.intensity,
      this.colorMode,
      this.specifiedColor.red,
      this.specifiedColor.green,
      this.specifiedColor.blue,
    );
  }
}