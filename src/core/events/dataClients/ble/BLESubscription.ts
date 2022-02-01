import {BLEDeviceIdentification, BLEEvent} from './BLEEvent';

export class BLESubscribeToDevice
  extends BLEEvent<BLEDeviceIdentification> {

  constructor(
    bleAddress: string,
    deviceId: string,
  ) {
    super(
      'Subscribe',
      new BLEDeviceIdentification(
        bleAddress,
        deviceId,
      ),
    );
  }
}
