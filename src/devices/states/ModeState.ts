import {EnumType} from '../../util/types';

interface IModeState<Mode extends EnumType<string | number>> {
  currentMode: Mode;
}

export function ModeStateConfig<ModeEnum extends EnumType<string | number>>(
  mode: ModeEnum,
) {
  return class ModeState
    implements IModeState<typeof mode> {
    currentMode: ModeEnum = mode;
  };
}