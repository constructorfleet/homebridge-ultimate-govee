import {Emitter} from '../../util/types';
import {EventEmitter2, OnEvent} from '@nestjs/event-emitter';
import {Injectable} from '@nestjs/common';
import {PlatformConfigBeforeAfter} from './events/PluginConfiguration';
import deepDiff from 'deep-diff-pizza';
import jmesPath from 'jmespath';
import {LoggingService} from '../../logging/LoggingService';
import { DeviceRefreshEvent } from '../../core/events/devices/DeviceRefresh';

@Injectable()
export class ConfigurationChangeHandler extends Emitter {

  constructor(
    eventEmitter: EventEmitter2,
    private readonly log: LoggingService,
  ) {
    super(eventEmitter);
  }

  @OnEvent(
    'PLATFORM.CONFIG.Reloaded', {
      async: true,
      nextTick: true,
    }
  )
  async onPlatformConfigurationReloaded(
    {
      before,
      after,
    }: PlatformConfigBeforeAfter,
  ) {

    const diff = deepDiff(before, after);
    const specificChanges = jmesPath.search(
      diff,
      '[?operation!=`UNCHANGED`] | ' +
      '{' +
      ' devices: [?starts_with(path, `device`)],' +
      ' credentials: [?path==`username`||path==`password`]' +
      ' ' +
      '}',
    );

    specificChanges.devices.reduce(
      (acc: Set<string>, cur) => {
        const deviceTypeIndex: string = cur['path']?.split('.')[1] ?? undefined;
        if (!deviceTypeIndex) {
          return acc;
        }
        const indexMatch = /.+\[(?<index>\d+)\]/.exec(deviceTypeIndex);
        if (!indexMatch || !indexMatch.groups) {
          return acc;
        }
        const deviceIndex = indexMatch.groups['index'];
        const deviceType = deviceTypeIndex.substring(0, deviceTypeIndex.indexOf('['));
        const devices = before.devices ? before.devices[deviceType] : after.devices ? after.devices[deviceType] : undefined;
        if (!devices) {
          return acc;
        }
        acc.add(devices[deviceIndex].deviceId);
      },
      new Set<string>(),
    ).forEach(async (deviceId) => await this.emitAsync(
      new DeviceRefreshEvent({
        deviceId,
      }),
    ));

    this.log.info(specificChanges);
  }
}