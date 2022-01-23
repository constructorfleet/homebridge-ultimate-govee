import {Inject, Injectable} from '@nestjs/common';
import {PERSIST_CONFIGURATION} from '../util/const';
import {PersistConfiguration} from './PersistConfiguration';
import {PersistedData} from '../core/structures/persist/PersistedData';
import {plainToInstance} from 'class-transformer';
import * as fs from 'fs';
import {PLUGIN_NAME} from '../settings';
import {OAuthData} from '../core/structures/AuthenticationData';

@Injectable()
export class PersistService {
  private readonly storageFilePath: string = `${this.config.storagePath}/${PLUGIN_NAME}.json`;

  constructor(
    @Inject(PERSIST_CONFIGURATION) private readonly config: PersistConfiguration,
  ) {
    if (!fs.existsSync(this.storageFilePath)) {
      fs.writeFileSync(this.storageFilePath, '{}');
    }
  }

  get persistedData(): PersistedData {
    const data = fs.readFileSync(this.storageFilePath, {encoding: 'utf8'});
    return plainToInstance(PersistedData, JSON.parse(data));
  }

  set persistedData(data: PersistedData) {
    fs.writeFileSync(this.storageFilePath, JSON.stringify(data), {encoding: 'utf8'});
  }

  get oauthData(): OAuthData | undefined {
    return this.persistedData.oauthData;
  }

  set oauthData(data: OAuthData | undefined) {
    const persistData = this.persistedData;
    persistData.oauthData = data;
    this.persistedData = persistData;
  }
}