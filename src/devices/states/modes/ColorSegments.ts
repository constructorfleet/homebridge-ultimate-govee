import {DeviceState} from '../../../core/structures/devices/DeviceState';
import {getCommandCodes, getCommandValues} from '../../../util/opCodeUtils';
import {COMMAND_IDENTIFIER, REPORT_IDENTIFIER, SEGMENT_COUNT} from '../../../util/const';
import {ColorRGB} from '../../../util/colorUtils';
import {State} from '../State';
import {modeCommandIdentifiers, ModesState} from '../Modes';

const reportIdentifiers = [
  165,
];

const reportSegmentIdentifiers = [
  17,
];

const reportVariableSegmentIdentifiers = [
  65,
];

export interface ColorSegmentsModeConstructorArgs {
  colorSegmentsModeIdentifier?: number;
  colorSegmentCount?: number;
  reportSegmentIdentifier?: number;
  isVariable?: boolean;
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
  reportSegmentIdentifier?: number[];
  isVariable?: boolean;

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
  isVariable: boolean,
  stateType: new (...args) => StateType,
) {
  // @ts-ignore
  return class extends stateType implements ColorSegmentsModeState {
    public activeMode?: number;
    public modes!: number[];
    public colorSegmentModeIdentifier!: number;
    public colorSegmentCount = 0;
    public colorSegments: ColorSegment[] = [];
    public reportSegmentIdentifier!: number[];
    public isVariable!: boolean;

    public constructor(args) {
      super(args);
      this.addDeviceStatusCodes(modeCommandIdentifiers);
      this.colorSegmentModeIdentifier = args.colorSegmentsModeIdentifier ?? 21;
      this.reportSegmentIdentifier = args.isVariable === true
        ? reportVariableSegmentIdentifiers
        : reportSegmentIdentifiers;
      this.isVariable = args.isVariable === true;
    }

    public parseSegmentCount(deviceState: DeviceState): ThisType<this> {
      const commandValues = getCommandValues(
        [
          REPORT_IDENTIFIER,
          ...this.reportSegmentIdentifier,
        ],
        deviceState.commands,
      );

      if (!commandValues || (commandValues?.length || 0) === 0) {
        return this;
      }

      this.colorSegmentCount = commandValues[0][2];
      if (this.colorSegments.length === this.colorSegmentCount) {
        return this;
      }
      if (this.colorSegments.length > this.colorSegmentCount) {
        this.colorSegments = this.colorSegments.splice(this.colorSegmentCount);
      } else if (this.colorSegments.length < this.colorSegmentCount!) {
        this.colorSegments =
          this.colorSegments.concat(
            Array.from(
              new Array(this.colorSegmentCount - this.colorSegments.length),
              () => {
                return new ColorSegment(
                  new ColorRGB(0, 0, 0),
                  0,
                );
              },
            ),
          );
      }
      return this;
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
              deviceState.color?.red ?? deviceState.color?.r ?? 0,
              deviceState.color?.green ?? deviceState.color?.g ?? 0,
              deviceState.color?.blue ?? deviceState.color?.b ?? 0,
            ),
          ),
        );

        return super.parse(deviceState);
      }

      this.parseSegmentCount(deviceState);

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

      const segmentPerCommand = this.isVariable ? 4 : 3;
      this.activeMode = this.colorSegmentModeIdentifier;
      commandValues?.forEach(
        (cmdValues) => {
          const startIndex = (cmdValues[0] - 1) * segmentPerCommand;
          for (let i = 0; i < segmentPerCommand; i++) {
            if (!this.colorSegments[startIndex + i]) {
              break;
            }
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
      while (index >= 0) {
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
      if (index === undefined || index < 0 || index > this.colorSegments.length) {
        return [];
      }

      return getCommandCodes(
        COMMAND_IDENTIFIER,
        [
          ...modeCommandIdentifiers,
          this.colorSegmentModeIdentifier,
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
      if (index === undefined || index < 0 || index > this.colorSegments.length) {
        return [];
      }

      return getCommandCodes(
        COMMAND_IDENTIFIER,
        [
          ...modeCommandIdentifiers,
          this.colorSegmentModeIdentifier,
          2,
        ],
        brightness,
        ...this.indexToSegmentBits(index),
      );
    }
  };
}
