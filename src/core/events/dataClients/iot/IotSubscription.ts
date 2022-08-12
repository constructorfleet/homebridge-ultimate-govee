import {IoTEvent, IoTEventData} from './IoTEvent';

export class IoTSubscribeToEvent
    extends IoTEvent<IoTEventData> {

  constructor(
      topic: string,
  ) {
    super(
        'Subscribe',
        new IoTEventData(
            topic,
            topic,
        ),
    );
  }
}

export class IoTSubscribedToEvent
    extends IoTEvent<IoTEventData> {

  constructor(
      topic: string,
      lastMessage?: string,
  ) {
    super(
        'Subscribed',
        new IoTEventData(
            topic,
            lastMessage || '',
        ),
    );
  }
}
