import { ClassConstructor, plainToInstance } from 'class-transformer';

export const plainToSingleInstance = <T>(
  type: ClassConstructor<T>,
  plain: any,
): T => plainToInstance(type, plain) as T;

export const using = <T>(subject: T) => ({
  do: (fn: (subject: T) => void): T => {
    fn(subject);
    return subject;
  },
});
