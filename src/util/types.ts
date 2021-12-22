export type Constructor<TypeClass> = new (...args) => TypeClass;

export type EnumType<T> =
  { [key in string]: T | number; }
  | { [key in number]: string; };

interface IConstruct<TypeClass, TypeConstructor extends Constructor<TypeClass>> {
  // we can use built-in InstanceType to infer instance type from class type
  type: new (...args: ConstructorParameters<TypeConstructor>) => InstanceType<TypeConstructor>;
}
