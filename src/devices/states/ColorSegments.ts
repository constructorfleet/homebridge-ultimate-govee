import {State} from './State';
import {DeviceState} from '../../core/structures/devices/DeviceState';
import {getCommandCodes, getCommandValues} from '../../util/opCodeUtils';
import {COMMAND_IDENTIFIER, REPORT_IDENTIFIER} from '../../util/const';
import {ColorRGB} from '../../util/colorUtils';
import {arrayReplace} from '../../util/arrayUtils';

const SEGMENT_COUNT = 15;

class ColorLeftRight {
  private bitArray: number[] = new Array<number>(SEGMENT_COUNT).fill(0);

  public get left(): number {
    return this.bitArray.slice(0, 8)
      .reduce(
        (res: number, val: number) =>
          (res << 1) | val,
      );
  }

  public get right(): number {
    return this.bitArray.slice(9)
      .reduce(
        (res: number, val: number) =>
          (res << 1) | val,
      );
  }

  public set(
    index: number,
    value: number,
  ): this {
    this.bitArray = arrayReplace(
      this.bitArray,
      index,
      value,
    );
    return this;
  }

  constructor(
    public readonly color: ColorRGB,
  ) {
  }
}

const commandIdentifiers = [
  5,
  11,
];

export interface ColorSegmentsState {
  colorSegments: ColorRGB[];

  get colorSegmentsChange(): number[][];
}

export function ColorSegments<StateType extends State>(
  stateType: new (...args) => StateType,
) {
  // @ts-ignore
  return class extends stateType implements ColorSegmentsState {
    public colorSegments: ColorRGB[] = new Array(SEGMENT_COUNT).fill(new ColorRGB(0, 0, 0));

    public constructor(...args) {
      super(...args);
      this.addDeviceStatusCodes(commandIdentifiers);
    }

    public override parse(deviceState: DeviceState): ThisType<this> {
      const commandValues = getCommandValues(
        [REPORT_IDENTIFIER, ...commandIdentifiers],
        deviceState.commands,
      );
      if (commandValues) {
        const color = new ColorRGB(
          commandValues[0],
          commandValues[1],
          commandValues[2],
        );
        const leftSegments = '0'.repeat(8)
          .concat(
            (commandValues[5] >> 0)
              .toString(2),
          ).slice(-8)
          .split('')
          .reverse()
          .map((x) => x === '1');
        const rightSegments = '0'.repeat(8)
          .concat(
            (commandValues[6] >> 0)
              .toString(2),
          ).slice(-8)
          .split('')
          .reverse()
          .map((x) => x === '1');
        leftSegments.forEach(
          (active, idx) => {
            if (active) {
              this.colorSegments[idx] = color;
            }
          });
        rightSegments.forEach(
          (active, idx) => {
            if (active) {
              this.colorSegments[9 + idx] = color;
            }
          });
      }

      return super.parse(deviceState);
    }

    public get colorSegmentsChange(): number[][] {
      return Array.from(
        this.colorSegments
          .reduce(
            (groups: Map<string, ColorLeftRight>, color: ColorRGB | undefined, idx: number) =>
              color
                ? groups.set(
                  color.hex,
                  (groups.get(color.hex) || new ColorLeftRight(color)).set(idx, 1))
                : groups,
            new Map<string, ColorLeftRight>(),
          ).values(),
      ).map(
        (colorLeftRight: ColorLeftRight) =>
          getCommandCodes(
            COMMAND_IDENTIFIER,
            commandIdentifiers,
            colorLeftRight.color.red,
            colorLeftRight.color.green,
            colorLeftRight.color.blue,
            0x00,
            0x00,
            colorLeftRight.left,
            colorLeftRight.right,
          ),
      );
    }
  };
}