import {ConstrainedString} from '../ConstrainedString';

export const DeviceModel = ConstrainedString(
    'DeviceModel',
    'The Govee product model nuymber',
    {
        minLength: 1,
    },
);