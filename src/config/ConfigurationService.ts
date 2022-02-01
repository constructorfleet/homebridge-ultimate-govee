import {Inject, Injectable} from '@nestjs/common';
import {GOVEE_CONFIGURATION} from '../util/const';
import {GoveeConfiguration} from './GoveeConfiguration';

@Injectable()
export class ConfigurationService {

  constructor(
    @Inject(GOVEE_CONFIGURATION) private readonly config: GoveeConfiguration,
  ) {

  }

  get username(): string {
    return this.config.username;
  }

  get password(): string {
    return this.config.password;
  }

  get apiKey(): string {
    return this.config.apiKey;
  }
}