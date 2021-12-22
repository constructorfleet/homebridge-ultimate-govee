export class ExtendedSet<T>
  implements Set<T> {
  private readonly items = new Set<T>();

  constructor(values?: readonly T[] | null | undefined) {
    if (values) {
      this.items = new Set<T>(values);
    }
  }

  map<R>(
    fn: (T) => R,
  ): ExtendedSet<R> {
    const newSet = new ExtendedSet<R>();
    for (const v of this.values()) {
      newSet.add(fn(v));
    }
    return newSet;
  }

  reduce<R>(
    fn: (R, T) => R,
    initial: R,
  ): R {
    let result = initial;
    for (const v of this) {
      result = fn(result, v);
    }
    return result;
  }

  filter(
    fn: (T) => boolean,
  ): ExtendedSet<T> {
    const newSet = new ExtendedSet<T>();
    for (const v of this) {
      if (fn(v)) {
        newSet.add(v);
      }
    }
    return newSet;
  }

  every(
    fn: (T) => boolean,
  ): boolean {
    for (const v of this) {
      if (!fn(v)) {
        return false;
      }
    }
    return true;
  }

  some(
    fn: (T) => boolean,
  ): boolean {
    for (const v of this) {
      if (fn(v)) {
        return true;
      }
    }
    return false;
  }

  readonly [Symbol.toStringTag]: string;
  readonly size: number = this.items.size;

  [Symbol.iterator](): IterableIterator<T> {
    return this.items[Symbol.iterator]();
  }

  add(value: T): this {
    this.items.add(value);
    return this;
  }

  clear(): void {
    this.items.clear();
  }

  delete(value: T): boolean {
    return this.items.delete(value);
  }

  entries(): IterableIterator<[T, T]> {
    return this.items.entries();
  }

  forEach(
    callbackfn: (value: T, value2: T, set: Set<T>) => void,
    thisArg?: unknown,
  ): void {
    this.items.forEach(
      callbackfn,
      thisArg,
    );
  }

  has(value: T): boolean {
    return this.items.has(value);
  }

  keys(): IterableIterator<T> {
    return this.items.keys();
  }

  values(): IterableIterator<T> {
    return this.items.values();
  }
}