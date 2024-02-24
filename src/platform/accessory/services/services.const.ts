import { Inject } from '@nestjs/common';

export const ServiceFactoryKey = 'Service.Factory' as const;
export const InjectServiceFactory = Inject(ServiceFactoryKey);
