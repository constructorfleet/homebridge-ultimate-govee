import {ConnectedState} from './ConnectedState';
import {ActiveState} from './ActiveState';
import {PowerState} from './PowerState';
import {BrightnessState} from './BrightnessState';
import {ControlLockState} from './ControlLockState';
import {MistLevelState} from './MistLevelState';
import {ProgrammableMistLevelState} from './ProgrammableMistLevelState';
import {SolidColorState} from './SolidColorState';
import {TimerState} from './TimerState';
import {StatusState} from './StatusState';

export * from './State';
export * from './ConnectedState';
export * from './ActiveState';
export * from './PowerState';
export * from './BrightnessState';
export * from './ControlLockState';
export * from './MistLevelState';
export * from './ProgrammableMistLevelState';
export * from './SolidColorState';
export * from './TimerState';
export * from './StatusState';
export * from './modes';

const stateMap = {};
stateMap[ConnectedState.name] = ConnectedState;
stateMap[ActiveState.name] = ActiveState;
stateMap[PowerState.name] = PowerState;
stateMap[BrightnessState.name] = BrightnessState;
stateMap[ControlLockState.name] = ControlLockState;
stateMap[MistLevelState.name] = MistLevelState;
stateMap[ProgrammableMistLevelState.name] = ProgrammableMistLevelState;
stateMap[SolidColorState.name] = SolidColorState;
stateMap[TimerState.name] = TimerState;
stateMap[StatusState.name] = StatusState;

export const StateMap = stateMap;