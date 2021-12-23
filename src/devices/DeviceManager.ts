import {autoInjectable, inject} from 'tsyringe';
import {RestClient} from '../data/clients/RestClient';
import {GoveeDevice} from './GoveeDevice';
import {GoveeHumidifier} from './GoveeHumidifier';
import {GoveeAirPurifier} from './GoveeAirPurifier';
import {DEVICE_SETTINGS_EVENT, DEVICE_STATE_EVENT} from '../util/const';
import {EventEmitter} from 'events';
import {EventHandler, Handles} from '../util/events';

@autoInjectable()
@EventHandler()
export class DeviceManager {
  private static readonly DEVICE_CLASSES = [
    GoveeHumidifier,
    GoveeAirPurifier,
  ];
  private devices: GoveeDevice[] = [];

  constructor(
    @inject(RestClient) private restClient: RestClient,
  ) {
  }

  async poll() {
    const devices = await this.restClient.getDevices();

  }

  @Handles(DEVICE_SETTINGS_EVENT)
  onDeviceSetting(deviceSettings) {
    console.log(deviceSettings);
  }

  @Handles(DEVICE_STATE_EVENT)
  onDeviceState(deviceState) {
    console.log(deviceState);
  }
}