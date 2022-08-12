import {IoTEvent, IoTEventData} from './IoTEvent';

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
