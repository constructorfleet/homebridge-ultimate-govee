import {Node} from './Node';
import {Field, InterfaceType} from '@nestjs/graphql';
import {DeviceId, DeviceModel, DeviceMqttTopic, DeviceName, GoodsType, PactCode, PactType, Version} from '../scalars';
import {MAC} from '../externals';


@InterfaceType(
  'Device',
  {
    description: 'Interface defining fields common to all devices',
    isAbstract: true,
    implements: () => [Node],
  },
)
export abstract class Device implements Node {
    @Field(
      () => DeviceId,
      {
        name: 'deviceId',
        description: 'The unique Govee device identifier',
      },
    )
    deviceId!: string;

    @Field(
      () => DeviceName,
      {
        name: 'name',
        description: 'The name associated with this device',
      },
    )
    name!: string;

    @Field(
      () => DeviceModel,
      {
        name: 'model',
        description: 'The Govee model number for this device',
      },
    )
    model!: string;

    @Field(
      () => Version,
      {
        name: 'hardwareVersion',
        description: 'The current firmware version for the device',
        nullable: true,
      },
    )
    hardwareVersion?: string;

    @Field(
      () => Version,
      {
        name: 'softwareVersion',
        description: 'The current software version for the device',
        nullable: true,
      },
    )
    softwareVersion?: string;

    @Field(
      () => PactType,
      {
        name: 'pactType',
        description: 'The pact type for this device',
      },
    )
    pactType!: number;

    @Field(
      () => PactCode,
      {
        name: 'pactCode',
        description: 'The pact code for this device',
      },
    )
    pactCode!: number;

    @Field(
      () => GoodsType,
      {
        name: 'goodsType',
        description: 'The type of good identifier for this device',
      },
    )
    goodsType!: number;

    @Field(
      () => MAC,
      {
        name: 'bleAddress',
        description: 'The mac address for the BLE modem',
        nullable: true,
      },
    )
    bleAddress?: string;

    @Field(
      () => MAC,
      {
        name: 'macAddress',
        description: 'The mac address for the WiFi modem',
        nullable: true,
      },
    )
    macAddress?: string;

    @Field(
      () => DeviceMqttTopic,
      {
        name: 'iotTopic',
        description: 'The MQTT topic for this device status and commands',
        nullable: true,
      },
    )
    iotTopic?: string;

    createdAt!: Date;
    id!: string;
    updatedAt!: Date;
}