import {DeviceMode} from './DeviceMode';
import {DeviceState} from '../../../core/structures/devices/DeviceState';
import {getCommandCodes, getCommandValues} from '../../../util/opCodeUtils';
import {COMMAND_IDENTIFIER, REPORT_IDENTIFIER} from '../../../util/const';

export class SceneMode extends DeviceMode {
  public modeIdentifier = 4;
  public sceneId = 0;

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
      this.sceneId = values[0];
    }

    return this;
  }

  public sceneChange(): number[] {
    return getCommandCodes(
      COMMAND_IDENTIFIER,
      this.commandIdentifiers,
      this.sceneId,
    );
  }
}