import { BehaviorSubject, Observer, Subject, Subscription } from 'rxjs';

export interface PartialSubject<T> {
  partialNext(value: Partial<T>);
  partialSubscribe(observer: Partial<Observer<Partial<T>>>): Subscription;
}

export class PartialBehaviorSubject<T>
  extends BehaviorSubject<T>
  implements PartialSubject<T>
{
  private readonly partial$ = new Subject<Partial<T>>();

  partialSubscribe(observer: Partial<Observer<Partial<T>>>): Subscription {
    return this.partial$.subscribe(observer);
  }

  partialNext(value: Partial<T>) {
    this.partial$.next(value);
    this.next({ ...this.getValue(), ...value });
  }
}
