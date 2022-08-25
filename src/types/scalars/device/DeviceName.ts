import {ConstrainedString} from "../ConstrainedString";


export const DeviceName = ConstrainedString(
  'DeviceName',
  'The name associated with the device',
  {
    minLength: 1,
    maxLength: 128,
  },
);