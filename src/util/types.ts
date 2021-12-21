import {ExtendedSet} from './extendedSet';

export type Constructor<TypeClass> = new (...args) => TypeClass;

export type EnumType<T> = {
  [id: string]: T | string;
  [nu: number]: string;
};

interface IConstruct<TypeClass, TypeConstructor extends Constructor<TypeClass>> {
  // we can use built-in InstanceType to infer instance type from class type
  type: new (...args: ConstructorParameters<TypeConstructor>) => InstanceType<TypeConstructor>;
}
