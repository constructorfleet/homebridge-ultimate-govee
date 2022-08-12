import {AccessoryService, IdentifiedService, ServiceSubType} from './AccessoryService';
import {Characteristic, CharacteristicValue, PlatformAccessory, Service} from 'homebridge';
import {GoveeDevice} from '../../../devices/GoveeDevice';
import {GoveeDeviceOverride, GoveeLightOverride} from '../../config/GoveePluginConfig';
import {SceneModeState} from '../../../devices/states/modes/Scene';
import {DeviceLightEffect} from '../../../effects/implementations/DeviceLightEffect';
import {EventEmitter2} from '@nestjs/event-emitter';
import {PlatformConfigService} from '../../config/PlatformConfigService';
import {Inject} from '@nestjs/common';
import {PLATFORM_CHARACTERISTICS, PLATFORM_SERVICES} from '../../../util/const';
import {LoggingService} from '../../../logging/LoggingService';
import {DeviceCommandEvent} from '../../../core/events/devices/DeviceCommand';
import {DeviceSceneTransition} from '../../../core/structures/devices/transitions/DeviceModeTransition';
import {ServiceRegistry} from '../ServiceRegistry';
import {LightDevice} from '../../../devices/implementations/GoveeLight';


@ServiceRegistry.register(
    LightDevice,
)
export class EffectService extends AccessoryService<number> {
  protected readonly serviceType = this.SERVICES.Switch;
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
                      undefined,
                      true,
                  ),
          ) || [];

      this.subTypes.push(...newTypes);
      return;
    }
    this.subTypes =
        lightOverride.effects
            ?.filter(
                (effect) => effect.enabled,
            )
            ?.map(
                (effect: DeviceLightEffect) =>
                    new ServiceSubType(
                        effect.name,
                        effect.id,
                        effect.name,
                        undefined,
                        true,
                    ),
            );
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
      console.log('EffectService', 'updateServiceCharacteristics', 'Not SceneMode');
      return;
    }
    const isModeActive = sceneModeState.activeMode === sceneModeState.sceneModeIdentifier;
    const isSceneActive = sceneModeState.activeSceneId === serviceIdentifier;

    service.getCharacteristic(this.CHARACTERISTICS.Name)
        .updateValue(serviceName);
    service.getCharacteristic(this.CHARACTERISTICS.On)
        .updateValue(isModeActive && isSceneActive)
        .onSet(async (value: CharacteristicValue) => {
              console.log('Effect Transition');
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
    return !(!Reflect.has(device, 'activeMode') && !Reflect.has(device, 'activeSceneId'));
  }

  protected shouldAddService(
      deviceOverride?: GoveeDeviceOverride,
      subType?: ServiceSubType<number>,
  ): boolean {
    if (!deviceOverride) {
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
