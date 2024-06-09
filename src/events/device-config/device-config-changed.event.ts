import { BaseEvent } from '../base.event';

export abstract class DeviceConfigChangedEvent extends BaseEvent {
  constructor(readonly deviceId: string) {
    super();
  }
}
