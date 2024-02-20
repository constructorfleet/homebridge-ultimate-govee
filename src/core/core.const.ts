import { Inject } from '@nestjs/common';

export const CoreModuleOptionsKey = 'Core.Options' as const;
export const HomebridgeServicesKey = 'Core.Homebridge.Services' as const;
export const InjectServices = Inject(HomebridgeServicesKey);
export const HomebridgeCharacteristicsKey =
  'Core.Homebridge.Characteristics' as const;
export const InjectCharacteristics = Inject(HomebridgeCharacteristicsKey);
export const HomebridgeApiKey = 'Core.Homebridge.Api' as const;
export const InjectHomebridgeApi = Inject(HomebridgeApiKey);
export const GenerateUUIDKey = 'Core.Homebridge.UUID' as const;
export const InjectUUID = Inject(GenerateUUIDKey);
