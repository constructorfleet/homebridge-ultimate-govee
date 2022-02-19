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

export class RGBMusicMode extends DeviceMode {
  public modeIdentifier = 14;
  public musicModeType = 0;
  public sensitivity = 0;

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
      this.populateFromCommandValues(values.slice(2));
    }

    return this;
  }

  public populateFromCommandValues(
    commandValues: number[],
  ): ThisType<this> {
    return this;
  }

  public musicChange(): number[] {
    return getCommandCodes(
      COMMAND_IDENTIFIER,
      this.commandIdentifiers,
      this.musicModeType,
      this.sensitivity,
      ...this.extraCommandValues(),
    );
  }

  public extraCommandValues(): number[] {
    return [];
  }
}