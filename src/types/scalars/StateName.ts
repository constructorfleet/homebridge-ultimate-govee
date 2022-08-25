import {ConstrainedString} from "./ConstrainedString";


export const StateName = ConstrainedString(
    'StateName',
    'The name of the device state',
    {
        minLength: 1,
        maxLength: 128,
    },
);