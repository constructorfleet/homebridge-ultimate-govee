import {
  GoveeLightOverride,
  GoveeRGBICLightOverride,
  GoveePluginConfig as v1Config,
} from '../v1/plugin-config.govee';
import { GoveePluginConfig } from './plugin-config.govee';
import { DeviceConfig } from './devices/device.config';
import {
  DiyEffectConfig,
  LightEffectConfig,
  RGBICLightDeviceConfig,
  RGBLightDeviceConfig,
} from './devices/light.config';

export const migrateConfig = (config: v1Config): GoveePluginConfig => {
  const newConfig = new GoveePluginConfig();
  newConfig.name = config.name;

  newConfig.credentials.username = config.username;
  newConfig.credentials.password = config.password;

  newConfig.controlChannels.ble = config.connections?.ble === true;
  newConfig.controlChannels.iot = config.connections?.iot === true;

  config.devices?.airPurifiers
    ?.filter((device) => device.deviceId !== undefined)
    .forEach((device) => {
      const deviceConfig = new DeviceConfig();
      deviceConfig.id = device.deviceId!;
      deviceConfig.name = device.displayName;
      deviceConfig.ignore = device.ignore === true;
      newConfig.deviceConfigs[deviceConfig.id] = deviceConfig;
    });
  config.devices?.humidifiers
    ?.filter((device) => device.deviceId !== undefined)
    .forEach((device) => {
      const deviceConfig = new DeviceConfig();
      deviceConfig.id = device.deviceId!;
      deviceConfig.name = device.displayName;
      deviceConfig.ignore = device.ignore === true;
      newConfig.deviceConfigs[deviceConfig.id] = deviceConfig;
    });
  config.devices?.lights
    ?.filter((device) => device.deviceId !== undefined)
    ?.map((device) => device as GoveeLightOverride)
    ?.forEach((device) => {
      let ctor;
      if (device._lightType === 'RGBIC') {
        ctor = RGBICLightDeviceConfig;
      } else {
        ctor = RGBLightDeviceConfig;
      }

      const deviceConfig: RGBICLightDeviceConfig | RGBLightDeviceConfig =
        new ctor();
      deviceConfig.id = device.deviceId!;
      deviceConfig.name = device.displayName;
      deviceConfig.ignore = device.ignore === true;
      deviceConfig.effects =
        device.effects?.map((effect) => {
          const lightConfig = new LightEffectConfig();
          lightConfig.code = effect.id;
          lightConfig.description = effect.description;
          lightConfig.enabled = effect.enabled === true;
          lightConfig.name = effect.name;
          return lightConfig;
        }) ?? [];
      deviceConfig.diy =
        device.effects?.map((effect) => {
          const diyConfig = new DiyEffectConfig();
          diyConfig.code = effect.id;
          diyConfig.name = effect.name;
          return diyConfig;
        }) ?? [];
      if (deviceConfig instanceof RGBICLightDeviceConfig) {
        if (device instanceof GoveeRGBICLightOverride) {
          deviceConfig.showSegments = device.hideSegments === false;
        }
      }
      newConfig.deviceConfigs[deviceConfig.id] = deviceConfig;
    });

  return newConfig;
};
