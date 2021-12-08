export type Constructor<TypeClass> = new (...args) => TypeClass;

export type EnumType<T> = {
  [id: string]: T | string;
  [nu: number]: string;
};
