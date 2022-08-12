import {IoTEvent, IoTEventData} from './IoTEvent';

export class IoTUnsubscribeFromEvent
  extends IoTEvent<IoTEventData> {

  constructor(
    topic: string,
  ) {
    super(
      'Unsubscribe',
      new IoTEventData(
        topic,
        topic,
      ),
    );
  }
}

export class IoTUnsubscribedFromEvent
  extends IoTEvent<IoTEventData> {

  constructor(
    topic: string,
    lastMessage?: string,
  ) {
    super(
      'Unsubscribed',
      new IoTEventData(
        topic,
        lastMessage || '',
      ),
    );
  }
}
