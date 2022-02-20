import {DeviceMode} from './DeviceMode';
import {DeviceState} from '../../../core/structures/devices/DeviceState';
import {getCommandCodes, getCommandValues} from '../../../util/opCodeUtils';
import {COMMAND_IDENTIFIER, REPORT_IDENTIFIER} from '../../../util/const';
import {ColorRGB} from '../../../util/colorUtils';

export class ColorMode extends DeviceMode {
  public modeIdentifier = 13;
  public solidColor: ColorRGB = new ColorRGB(0, 0, 0);

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
      this.solidColor.red = values[0];
      this.solidColor.green = values[1];
      this.solidColor.blue = values[2];
    }

    return this;
  }

  public colorChange(): number[] {
    return getCommandCodes(
      COMMAND_IDENTIFIER,
      this.commandIdentifiers,
      this.solidColor.red,
      this.solidColor.green,
      this.solidColor.blue,
    );
  }
}