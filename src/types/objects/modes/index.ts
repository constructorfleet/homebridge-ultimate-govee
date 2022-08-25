import {ColorMode} from './ColorMode';
import {SceneMode} from './SceneMode';

export * from './ColorMode';
export * from './SceneMode';

const modeMap = {};

modeMap[ColorMode.name] = ColorMode;
modeMap[SceneMode.name] = SceneMode;

export const ModeMap = modeMap;