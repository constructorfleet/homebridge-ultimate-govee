export interface BLEConfig
  extends ConnectionConfig {
  bleName?: string;

  bleAddress?: string;
}

export const supportsBLE = (arg): BLEConfig | undefined => {
  return Reflect.has(arg, 'bleName') && arg.bleName
    ? arg as BLEConfig
    : undefined;
};