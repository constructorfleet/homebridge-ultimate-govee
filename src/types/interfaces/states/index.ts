import {ConnectedState} from '../../objects/states/ConnectedState';
import {ActiveState} from '../../objects/states/ActiveState';
import {PowerState} from '../../objects/states/PowerState';
import {BrightnessState} from '../../objects/states/BrightnessState';
import {ControlLockState} from '../../objects/states/ControlLockState';
import {MistLevelState} from '../../objects/states/MistLevelState';
import {ProgrammableMistLevelState} from '../../objects/states/ProgrammableMistLevelState';
import {SolidColorState} from '../../objects/states/SolidColorState';
import {TimerState} from '../../objects/states/TimerState';
import {StatusState} from '../../objects/states/StatusState';

export * from './State';
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