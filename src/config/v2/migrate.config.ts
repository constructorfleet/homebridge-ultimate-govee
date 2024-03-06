import {
  GoveeLightOverride,
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

  newConfig.controlChannels.ble.next(config.connections?.ble === true);
  newConfig.controlChannels.iot.next(config.connections?.iot === true);

  config.devices?.airPurifiers
    ?.filter((device) => device.deviceId !== undefined)
    .forEach((device) => {
      const deviceConfig = new DeviceConfig();
      deviceConfig.id = device.deviceId!;
      deviceConfig.name = device.displayName;
      deviceConfig.ignore.next(device.ignore === true);
      newConfig.deviceConfigs.push(deviceConfig);
    });
  config.devices?.humidifiers
    ?.filter((device) => device.deviceId !== undefined)
    .forEach((device) => {
      const deviceConfig = new DeviceConfig();
      deviceConfig.id = device.deviceId!;
      deviceConfig.name = device.displayName;
      deviceConfig.ignore.next(device.ignore === true);
      newConfig.deviceConfigs.push(deviceConfig);
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

      const deviceConfig = new ctor();
      deviceConfig.id = device.deviceId!;
      deviceConfig.name = device.displayName;
      deviceConfig.ignore.next(device.ignore === true);
      deviceConfig.override = device;
      deviceConfig.effects =
        device.effects?.map((effect) => {
          const lightConfig = new LightEffectConfig();
          lightConfig.code = effect.id;
          lightConfig.description = effect.description;
          lightConfig.enabled.next(effect.enabled === true);
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
      newConfig.deviceConfigs.push(deviceConfig);
    });

  return newConfig;
};
