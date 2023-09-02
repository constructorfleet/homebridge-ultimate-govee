import {Inject, Injectable} from '@nestjs/common';
import {PERSIST_CONFIGURATION} from '../util/const';
import {PersistConfiguration} from './PersistConfiguration';
import {PersistedData} from '../core/structures/persist/PersistedData';
import {plainToInstance} from 'class-transformer';
import * as fs from 'fs';
import { writeFile } from 'fs/promises';
import {PLUGIN_NAME} from '../settings';
import {OAuthData} from '../core/structures/AuthenticationData';
import { IotClientData } from '../core/structures/IoTClientData';

@Injectable()
export class PersistService {
  private readonly storageFilePath: string = `${this.config.storagePath}/${PLUGIN_NAME}.json`;
  private readonly pfxFilePath: string = `${this.config.storagePath}/govee.pfx`;

  constructor(
    @Inject(PERSIST_CONFIGURATION) private readonly config: PersistConfiguration,
  ) {
    if (!fs.existsSync(this.storageFilePath)) {
      fs.writeFileSync(this.storageFilePath, '{}');
    }
  }

  get goveePfxPath(): string {
    return this.pfxFilePath;
  }

  async setGoveePfxData(p12Data: string) {
    await writeFile(this.pfxFilePath, Buffer.from(p12Data, 'base64'));
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

  get iotClientData(): IotClientData | undefined {
    return this.persistedData.iotData;
  }

  set iotClientData(data: IotClientData | undefined) {
    const persistData = this.persistedData;
    persistData.iotData = data;
    this.persistedData = persistData;
  }
}