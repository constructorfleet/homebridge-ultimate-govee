import {ExtendedSet} from './extendedSet';

export abstract class Observable {
  observers = new ExtendedSet<Observer>();

  public attach(observer: Observer): this {
    this.observers.add(observer);
    return this;
  }

  public detach(observer: Observer): this {
    this.observers.delete(observer);
    return this;
  }

  public notify(): this {
    this.observers
      .forEach(
        (observer) => observer.onUpdate(this),
      );
    return this;
  }
}

export interface Observer {
  onUpdate(subject: Observable);
}