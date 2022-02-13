import {State} from './State';
import {DeviceState} from '../../core/structures/devices/DeviceState';
import {getCommandCodes, getCommandValues} from '../../util/opCodeUtils';
import {COMMAND_IDENTIFIER, SEGMENT_COUNT} from '../../util/const';
import {ColorRGB} from '../../util/colorUtils';
import {arrayReplace} from '../../util/arrayUtils';

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

const reportIdentifiers = [
  0xa5,
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
        [0xa5],
        deviceState.commands,
      );
      if ((commandValues?.length || 0) > 0) {
        this.colorSegments.fill(new ColorRGB(0, 0, 0));
      }
      commandValues?.forEach(
        (cmdValues) => {
          const startIndex = (cmdValues[0] - 1) * 3;
          for (let i = 0; i < 3; i++) {
            const color = new ColorRGB(
              cmdValues[i * 4 + 2],
              cmdValues[i * 4 + 3],
              cmdValues[i * 4 + 4],
            );
            arrayReplace(
              this.colorSegments,
              startIndex + i,
              color,
            );
          }
        },
      );

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