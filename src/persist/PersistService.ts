import {Inject, Injectable} from '@nestjs/common';
import {PERSIST_CONFIGURATION} from '../util/const';
import {PersistConfiguration} from './PersistConfiguration';
import {PersistedData} from '../core/structures/persist/PersistedData';
import {instanceToPlain, plainToInstance} from 'class-transformer';
import * as fs from 'fs';
import {PLUGIN_NAME} from '../settings';

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
    const data = fs.readFileSync(this.storageFilePath);
    return plainToInstance(PersistedData, data);
  }

  set persistedData(data: PersistedData) {
    fs.writeFileSync(this.storageFilePath, JSON.stringify(instanceToPlain(data)));
  }
}