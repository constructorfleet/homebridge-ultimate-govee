export abstract class GoveeDevice {
  protected constructor(
    public name: string,
    public deviceId: string,
    public model: string,
  ) {
  }
}