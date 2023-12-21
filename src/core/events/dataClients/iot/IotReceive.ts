import { IoTEvent, IoTEventData } from './IoTEvent';

export class IotReceive
  extends IoTEvent<IoTEventData> {

  constructor(
    topic: string,
    payload: string,
  ) {
    super(
      'Received',
      new IoTEventData(
        topic,
        payload,
      ),
    );
  }
}

export class IotDeviceReceive
  extends IoTEvent<IoTEventData> {

  constructor(
    topic: string,
    payload: string,
  ) {
    super(
      'Device.Received',
      new IoTEventData(
        topic,
        payload,
      ),
    );
  }
}