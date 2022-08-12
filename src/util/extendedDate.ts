export class ExtendedDate
    extends Date {

  constructor(value: number | string) {
    super(value);
  }

  addHours = (hours: number): Date =>
      new Date(
          new Date(this).setHours(
              this.getHours() + hours,
          ),
      );
}
