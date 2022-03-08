import {DeviceState} from '../../../core/structures/devices/DeviceState';
import {getCommandCodes, getCommandValues} from '../../../util/opCodeUtils';
import {COMMAND_IDENTIFIER, REPORT_IDENTIFIER, SEGMENT_COUNT} from '../../../util/const';
import {ColorRGB} from '../../../util/colorUtils';
import {State} from '../State';
import {modeCommandIdentifiers, ModesState} from '../Modes';
import {GoveeDeviceConstructorArgs} from '../../GoveeDevice';

const reportIdentifiers = [
  165,
];

export interface ColorSegmentsModeConstructorArgs {
  colorSegmentsModeIdentifier?: number;
  colorSegmentCount?: number;
}

export class ColorSegment {
  constructor(
    public color: ColorRGB,
    public brightness: number,
  ) {
  }
}

export interface ColorSegmentsModeState extends ModesState {
  colorSegmentCount: number;
  colorSegments: ColorSegment[];
  colorSegmentModeIdentifier?: number;

  colorSegmentsChange(
    color: ColorRGB,
    index?: number,
  ): number[];

  brightnessSegmentsChange(
    brightness: number,
    index?: number,
  ): number[];
}

export function ColorSegmentsMode<StateType extends State>(
  stateType: new (...args) => StateType,
) {
  // @ts-ignore
  return class extends stateType implements ColorSegmentsModeState {
    public activeMode?: number;
    public modes!: number[];
    public colorSegmentCount: number;
    public colorSegmentModeIdentifier!: number;
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

    public constructor(args: ColorSegmentsModeConstructorArgs & GoveeDeviceConstructorArgs) {
      super(args);
      this.addDeviceStatusCodes(modeCommandIdentifiers);
      this.colorSegmentModeIdentifier = args.colorSegmentsModeIdentifier ?? 21;
      this.colorSegmentCount = args.colorSegmentCount ?? SEGMENT_COUNT;
    }

    public override parse(deviceState: DeviceState): ThisType<this> {
      if (deviceState.mode !== undefined) {
        this.activeMode = deviceState.mode;
      }
      if (deviceState.color !== undefined
        && (deviceState?.command ?? '') in ['colorwc', 'color']) {
        this.colorSegments.forEach(
          (segment: ColorSegment) => segment.color.update(
            new ColorRGB(
              deviceState.color!.red!,
              deviceState.color!.green!,
              deviceState.color!.blue!,
            ),
          ),
        );

        return super.parse(deviceState);
      }
      const commandValues = getCommandValues(
        [
          REPORT_IDENTIFIER,
          ...reportIdentifiers,
        ],
        deviceState.commands,
      );

      if (!commandValues || (commandValues?.length || 0) === 0) {
        return super.parse(deviceState);
      }

      this.activeMode = this.colorSegmentModeIdentifier;
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

      return super.parse(deviceState);
    }

    public indexToSegmentBits(index: number): number[] {
      const segmentBits: number[] = [];
      while (index < 8) {
        segmentBits.push(
          index < 8
            ? Math.pow(2, index)
            : 0,
        );
        index -= 8;
      }

      return segmentBits;
    }

    public colorSegmentsChange(
      color: ColorRGB,
      index?: number,
    ): number[] {
      if (!index || index < 0 || index > this.colorSegments.length) {
        return [];
      }

      return getCommandCodes(
        COMMAND_IDENTIFIER,
        [
          ...modeCommandIdentifiers,
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
        ...this.indexToSegmentBits(index),
      );
    }

    public brightnessSegmentsChange(
      brightness: number,
      index?: number,
    ): number[] {
      if (!index || index < 0 || index > this.colorSegments.length) {
        return [];
      }

      return getCommandCodes(
        COMMAND_IDENTIFIER,
        [
          ...modeCommandIdentifiers,
          2,
        ],
        brightness,
        ...this.indexToSegmentBits(index),
      );
    }
  };
}
