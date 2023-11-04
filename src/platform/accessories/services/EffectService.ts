import { AccessoryService, IdentifiedService, ServiceSubType } from './AccessoryService';
import { Characteristic, CharacteristicValue, PlatformAccessory, Service, UnknownContext, WithUUID } from 'homebridge';
import { GoveeDevice } from '../../../devices/GoveeDevice';
import { GoveeDeviceOverride, GoveeLightOverride } from '../../config/GoveePluginConfig';
import { SceneModeState } from '../../../devices/states/modes/Scene';
import { DeviceLightEffect } from '../../../effects/implementations/DeviceLightEffect';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PlatformConfigService } from '../../config/PlatformConfigService';
import { Inject } from '@nestjs/common';
import { PLATFORM_CHARACTERISTICS, PLATFORM_SERVICES } from '../../../util/const';
import { LoggingService } from '../../../logging/LoggingService';
import { DeviceCommandEvent } from '../../../core/events/devices/DeviceCommand';
import { DeviceSceneTransition } from '../../../core/structures/devices/transitions/DeviceModeTransition';
import { ServiceRegistry } from '../ServiceRegistry';
import { GoveeRGBICLight } from '../../../devices/implementations/GoveeRGBICLight';
import { GoveeRGBLight } from '../../../devices/implementations/GoveeRGBLight';
import { LightDevice } from '../../../devices/implementations/GoveeLight';


@ServiceRegistry.register(
  GoveeRGBICLight,
  GoveeRGBLight
)
export class EffectService extends AccessoryService<number, typeof Service.Switch> {
  protected readonly serviceType: WithUUID<typeof Service.Switch> = this.SERVICES.Switch;
  protected subTypes?: ServiceSubType<number>[];

  constructor(
    eventEmitter: EventEmitter2,
    configService: PlatformConfigService,
    @Inject(PLATFORM_SERVICES) SERVICES: typeof Service,
    @Inject(PLATFORM_CHARACTERISTICS) CHARACTERISTICS: typeof Characteristic,
    log: LoggingService,
  ) {
    super(
      eventEmitter,
      configService,
      SERVICES,
      CHARACTERISTICS,
      log,
    );
  }

  protected override addServiceTo(accessory: PlatformAccessory<UnknownContext>): Service | undefined {
    return accessory.addService(
      this.serviceType,
      accessory.displayName,
    );
  }

  protected override addSubserviceTo(accessory: PlatformAccessory<UnknownContext>,
    subType: ServiceSubType<number>,
  ): Service | undefined {
    this.log.info(`Adding subservice`, `${accessory.displayName} ${subType.nameSuffix || subType.subType}`);
    return accessory.addService(
      this.serviceType,
      `${accessory.displayName} ${subType.nameSuffix || subType.subType}`,
      subType.subType,
    );
  }

  public override setup(
    device: GoveeDevice,
    deviceOverride: GoveeDeviceOverride,
  ) {
    const lightOverride = deviceOverride as GoveeLightOverride;
    if (this.subTypes !== undefined) {
      const newTypes = lightOverride.effects
        ?.filter(
          (effect) =>
            !this.subTypes?.some(
              (subType) => subType.identifier === effect.id,
            ),
        )
        ?.map(
          (effect: DeviceLightEffect) =>
            new ServiceSubType(
              effect.name,
              effect.id,
              effect.name,
              false,
              true,
            ),
        ) || [];

      this.subTypes.push(...newTypes);
      return;
    }
    const subTypes =
      lightOverride.effects
        ?.filter(
          (effect) => effect.enabled && effect.name !== undefined && effect.name.length > 0,
        )
        ?.map(
          (effect: DeviceLightEffect) =>
            new ServiceSubType(
              effect.name,
              effect.id,
              effect.name,
              false,
              true,
            ),
        );
    if (subTypes && subTypes.length > 0) {
      this.subTypes = subTypes;
    }
  }

  updateServiceCharacteristics(
    service: Service,
    device: GoveeDevice,
    serviceIdentifier: number) {
    const serviceName =
      service.name
      ?? `${device.name} ${this.subTypes?.find((subType) => subType.identifier === serviceIdentifier)!.nameSuffix}`;
    const sceneModeState: SceneModeState = device as unknown as SceneModeState;
    if (!sceneModeState) {
      return;
    }
    const isModeActive = sceneModeState.activeMode === sceneModeState.sceneModeIdentifier;
    const isSceneActive = sceneModeState.activeSceneId === serviceIdentifier;

    service.getCharacteristic(this.CHARACTERISTICS.Name)
      .updateValue(serviceName);
    service.getCharacteristic(this.CHARACTERISTICS.On)
      .updateValue(isModeActive && isSceneActive)
      .onSet(async (value: CharacteristicValue) => {
        await this.emitAsync(
          new DeviceCommandEvent(
            new DeviceSceneTransition(
              device.deviceId,
              serviceIdentifier,
            ),
          ),
        );
      },
      );
  }

  protected supports(device: GoveeDevice): boolean {
    const result = device instanceof LightDevice;
    return result;
  }

  protected shouldAddService(
    deviceOverride?: GoveeDeviceOverride,
    subType?: ServiceSubType<number>,
  ): boolean {
    if (!deviceOverride || !subType) {
      return false;
    }
    return (deviceOverride as GoveeLightOverride).effects?.some(
      (effect: DeviceLightEffect) => effect.id === subType?.identifier && effect.enabled,
    ) ?? false;
  }

  protected processDeviceOverrides(
    accessory: PlatformAccessory,
    identifiedService: IdentifiedService<number>,
    device: GoveeDevice,
    deviceOverride?: GoveeDeviceOverride,
  ): IdentifiedService<number> | undefined {
    if (!deviceOverride || !identifiedService.service) {
      return undefined;
    }

    const subType = identifiedService.subType;
    const enabledEffects = (deviceOverride as GoveeLightOverride).effects?.filter(
      (effect: DeviceLightEffect) => effect.enabled,
    ) ?? [];
    if (
      enabledEffects.length === 0
      || !enabledEffects?.some((effect) => effect.id === subType?.identifier)
    ) {
      this.log.debug(
        'EffectService',
        'Removing Effect',
        device.deviceId,
        subType?.identifier,
        enabledEffects.length,
      );
      accessory.removeService(identifiedService.service);
      if (subType) {
        const subTypeItem = this.subTypes?.find((st) => st.identifier === subType.identifier);
        if (subTypeItem) {
          const subTypeIndex = this.subTypes?.indexOf(subTypeItem) || -1;
          if (subTypeIndex > -1) {
            this.subTypes?.splice(subTypeIndex, 1);
          }
        }
      }

      return undefined;
    }

    return identifiedService;
  }
}