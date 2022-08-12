import {LightDevice} from './GoveeLight';
import {ColorMode} from '../states/modes/Color';
import {SceneMode} from '../states/modes/Scene';
import {RGBMusicMode} from '../states/modes/RGBMusic';
import {DeviceFactory} from '../DeviceFactory';

@DeviceFactory.register(
  'H6107',
  'H6109',
  'H6110',
  'H6113',
  'H6114',
  'H6118',
  'H6119',
  'H6121',
  'H6129',
  'H6138',
  'H6139',
  'H613A',
  'H613B',
  'H613C',
  'H613D',
  'H613E',
  'H613F',
  'H6141',
  'H6142',
  'H6148',
  'H614A',
  'H614B',
  'H614E',
  'H6154',
  'H6159',
  'H615A',
  'H615B',
  'H615C',
  'H615D',
  'H6160',
  'H6165',
  'H6166',
  'H616B',
  'H6170',
  'H6171',
  'H6178',
  'H6184',
  'H6185',
  'H6188',
  'H6194',
  'H6195',
  'H6196',
  'H7090',
  'B7080',
  'B7081',
  'B7082',
)
export class GoveeRGBLight
  extends RGBMusicMode(
    SceneMode(
      ColorMode(
        LightDevice,
      ),
    ),
  ) {

  constructor(args) {
    super(args);
  }
}
