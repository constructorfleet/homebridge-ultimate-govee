import {ConstrainedNumber} from './ConstrainedNumber';

export const SceneId = ConstrainedNumber(
    'SceneId',
    'The identifier of a scene',
    {
        min: 0,
        max: 255,
        clamp: true,
    },
);