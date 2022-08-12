import {EffectEvent} from './EffectEvent';
import {CategoryScene} from '../../structures/api/responses/payloads/DeviceSceneListResponse';
import {DeviceLightEffect} from '../../../effects/implementations/DeviceLightEffect';

export interface DeviceSceneEffect {
  deviceId: string;
  id: number;
  name: string;
}

export abstract class DeviceEffectEvent<EventDataType>
  extends EffectEvent<EventDataType> {

  protected constructor(
    eventName: string,
    eventData: EventDataType,
  ) {
    super(
      `DEVICE.${eventName}`,
      eventData,
    );
  }
}

export class DeviceEffectsConfigured
  extends DeviceEffectEvent<DeviceLightEffect[]> {

  constructor(
    eventData: DeviceLightEffect[],
  ) {
    super('Configured', eventData);
  }
}

export class DeviceEffectReceived
  extends DeviceEffectEvent<CategoryScene[]> {

  constructor(
    eventData: CategoryScene[],
  ) {
    super('Received', eventData);
  }
}

export class DeviceEffectDiscovered
  extends DeviceEffectEvent<DeviceLightEffect[]> {

  constructor(
    eventData: DeviceLightEffect[],
  ) {
    super('Discovered', eventData);
  }
}
