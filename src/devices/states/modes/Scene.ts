import {DeviceMode} from './DeviceMode';
import {DeviceState} from '../../../core/structures/devices/DeviceState';
import {getCommandCodes, getCommandValues} from '../../../util/opCodeUtils';
import {COMMAND_IDENTIFIER, REPORT_IDENTIFIER} from '../../../util/const';

const commandIdentifiers = [
  5,
  4,
];

export class SceneMode extends DeviceMode {
  public sceneId = 0;

  public parse(deviceState: DeviceState): ThisType<this> {
    const commandValues = getCommandValues(
      [REPORT_IDENTIFIER, ...commandIdentifiers],
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
      commandIdentifiers,
      this.sceneId,
    );
  }
}