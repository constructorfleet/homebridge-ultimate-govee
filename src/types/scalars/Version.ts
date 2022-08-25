import {RegExString} from './RegExString';

export const Version = RegExString(
  'Version',
  'Version string matching major.minor.path',
  /^\d+(?:\.\d+){2,}$/,
);