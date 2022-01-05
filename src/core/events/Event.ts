export class EventNamespace {
  public readonly children: EventNamespace[];

  constructor(
    public readonly namespace: string,
    ...children: EventNamespace[]
  ) {
    this.children = children;
  }
}

export abstract class Event<EventDataType> {
  protected constructor(
    public readonly eventName: string,
    public readonly eventData?: EventDataType,
  ) {
  }
}