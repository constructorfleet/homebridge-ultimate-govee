export function arrayReplace<T>(arr: T[], index: number, value: T) {
  return [
    ...arr.slice(0, index),
    value,
    ...arr.slice(index),
  ];
}
