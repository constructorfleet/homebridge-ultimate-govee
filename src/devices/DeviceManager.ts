import {autoInjectable, inject, injectAll} from 'tsyringe';
import {RestClient} from '../data/clients/RestClient';
import {GoveeDevice} from './GoveeDevice';

@autoInjectable()
export class DeviceManage {
  private devices: GoveeDevice[] = [];
  constructor(
    @inject(RestClient) private restClient: RestClient,
  ){
  }

  async poll() {
    const devices = await this.restClient.getDevices();

  }

  async onDeviceSetting(data) {

  }

  async onDeviceState(data) {

  }
}