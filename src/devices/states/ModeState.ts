import {Constructor} from '../../util/types';

export interface IModeState<Mode extends string | number> {
  currentMode: Mode;

  setStateFrom(val: number);

  setState(val: Mode);

  conflateState(): number;
}

export function ModeStateConfig<ModeEnum extends string | number>(
  mode: ModeEnum,
  parse: (val: number) => ModeEnum,
  conflateTo: (val: ModeEnum) => number,
): ReturnType<<T extends IModeState<typeof mode>>() => Constructor<T>> {
  return class ModeState
    implements IModeState<typeof mode> {
    currentMode: ModeEnum = mode;

    setStateFrom(val: number) {
      this.setState(parse(val));
    }

    setState(val: ModeEnum) {
      this.currentMode = val;
    }

    conflateState(): number {
      return conflateTo(this.currentMode);
    }
  };
}