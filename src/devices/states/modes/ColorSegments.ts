import {DeviceState} from '../../../core/structures/devices/DeviceState';
import {getCommandCodes, getCommandValues} from '../../../util/opCodeUtils';
import {COMMAND_IDENTIFIER, REPORT_IDENTIFIER, SEGMENT_COUNT} from '../../../util/const';
import {ColorRGB} from '../../../util/colorUtils';
import {DeviceMode} from './DeviceMode';

const reportIdentifiers = [
  165,
];

export class ColorSegment {
  constructor(
    public color: ColorRGB,
    public brightness: number,
  ) {
  }
}

export class ColorSegmentsMode extends DeviceMode {
  public modeIdentifier = 21;
  public wholeColor?: ColorRGB;
  public wholeBrightness?: number;
  public colorSegments: ColorSegment[] =
    Array.from(
      new Array(SEGMENT_COUNT),
      () => {
        return new ColorSegment(
          new ColorRGB(0, 0, 0),
          0,
        );
      },
    );

  parse(deviceState: DeviceState): ThisType<this> {
    if (deviceState.command === 'colorwc' && deviceState.color !== undefined) {
      if (deviceState.color !== undefined) {
        this.wholeColor = new ColorRGB(
          deviceState.color.red,
          deviceState.color.green,
          deviceState.color.blue,
        );
        this.colorSegments.forEach(
          (segment: ColorSegment) => segment.color.update(
            new ColorRGB(
              deviceState.color?.red || 0,
              deviceState.color?.green || 0,
              deviceState.color?.blue || 0,
            ),
          ),
        );
      }
      return this;
    }

    if (deviceState.command === 'brightness' && deviceState.brightness !== undefined) {
      this.wholeBrightness = deviceState.brightness;
      this.colorSegments.forEach(
        (segment: ColorSegment) => segment.brightness = deviceState.brightness || 0,
      );

      return this;
    }
    const commandValues = getCommandValues(
      [REPORT_IDENTIFIER, ...reportIdentifiers],
      deviceState.commands,
    );

    if ((commandValues?.length || 0) > 0) {
      commandValues?.forEach(
        (cmdValues) => {
          const startIndex = (cmdValues[0] - 1) * 3;
          for (let i = 0; i < 3; i++) {
            const brightness = cmdValues[i * 4 + 1];
            const color = new ColorRGB(
              cmdValues[i * 4 + 2],
              cmdValues[i * 4 + 3],
              cmdValues[i * 4 + 4],
            );
            this.colorSegments[startIndex + i] =
              new ColorSegment(
                color,
                brightness,
              );
          }
        },
      );
    }

    return this;
  }

  public colorSegmentsChange(
    color: ColorRGB,
    index?: number,
  ): number[] {
    const leftSegments =
      index === undefined
        ? 255
        : (index) < 8
          ? Math.pow(2, index)
          : 0;
    const rightSegments =
      index === undefined
        ? 255
        : (index - 8) < 0
          ? 0
          : Math.pow(2, index - 8);
    return getCommandCodes(
      COMMAND_IDENTIFIER,
      [
        ...this.commandIdentifiers,
        1,
      ],
      color.red,
      color.green,
      color.blue,
      0,
      0,
      0,
      0,
      0,
      leftSegments,
      rightSegments,
    );
  }

  public brightnessSegmentsChange(
    brightness: number,
    index?: number,
  ): number[] {
    const leftSegments =
      index === undefined
        ? 255
        : (index) < 8
          ? Math.pow(2, index)
          : 0;
    const rightSegments =
      index === undefined
        ? 255
        : (index - 8) < 0
          ? 0
          : Math.pow(2, index - 8);
    return getCommandCodes(
      COMMAND_IDENTIFIER,
      [
        ...this.commandIdentifiers,
        2,
      ],
      brightness,
      leftSegments,
      rightSegments,
    );
  }
}