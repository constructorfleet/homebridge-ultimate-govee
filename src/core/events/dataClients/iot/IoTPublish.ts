import {IoTEvent, IoTEventData} from './IoTEvent';

export class IoTPublishToEvent
  extends IoTEvent<IoTEventData> {

  constructor(
    topic: string,
    payload: string,
  ) {
    super(
      'Publish',
      new IoTEventData(
        topic,
        payload,
      ),
    );
  }
}