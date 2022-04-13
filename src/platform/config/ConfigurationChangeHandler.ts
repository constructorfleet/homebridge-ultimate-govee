import {Emitter} from '../../util/types';
import {EventEmitter2, OnEvent} from '@nestjs/event-emitter';
import {Injectable} from '@nestjs/common';
import {PlatformConfigBeforeAfter} from './events/PluginConfiguration';
import deepDiff from 'deep-diff-pizza';
import jmesPath from 'jmespath';
import {LoggingService} from '../../logging/LoggingService';

@Injectable()
export class ConfigurationChangeHandler extends Emitter {

  constructor(
    eventEmitter: EventEmitter2,
    private readonly log: LoggingService,
  ) {
    super(eventEmitter);
  }

  @OnEvent(
    'PLATFORM.CONFIG.Reloaded',
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

    this.log.info(specificChanges);


  }
}