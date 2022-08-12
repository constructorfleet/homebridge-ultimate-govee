import {COMMAND_IDENTIFIER, REPORT_IDENTIFIER} from '../../../util/const';
import {ColorRGB} from '../../../util/colorUtils';
import {ColorMode, ColorModeState} from './Color';
import {State} from '../State';

type AssertChain<ArgumentType> = (actual: ArgumentType, expected: ArgumentType) => AssertChain<ArgumentType>;

class TestMode extends ColorMode(State) {
  constructor(args) {
    super(args);
  }
}

let testMode: ColorModeState & State;

const assertColor: AssertChain<number | undefined> = (
  actual?: number,
  expected?: number,
): AssertChain<number | undefined> => {
  if (expected === undefined) {
    expect(actual).toBeUndefined();
  } else {
    expect(actual).toBe(expected);
  }
  return assertColor;
};

const assertColorRGB = (
  red?: number,
  green?: number,
  blue?: number,
) => {
  assertColor(
    testMode.color?.red,
    red,
  )(
    testMode.color?.green,
    green,
  )(
    testMode.color?.blue,
    blue,
  );
};

describe('ColorMode', () => {
  beforeEach(() => {
    testMode = new TestMode(
      {
        colorModeIdentifier: 19,
      });
  });

  describe('parse', () => {
    it('processes DeviceState.mode', () => {
      assertColorRGB(
        undefined,
        undefined,
        undefined,
      );
      expect(testMode.activeMode).toBeUndefined();
      testMode.parse({
        deviceId: 'testDevice',
        command: 'status',
        mode: 10,
      });
      assertColorRGB(
        undefined,
        undefined,
        undefined,
      );
      expect(testMode.activeMode).toBe(10);
    });
    it('processes DeviceState.command === color', () => {
      assertColorRGB(
        undefined,
        undefined,
        undefined,
      );
      testMode.parse({
        deviceId: 'testDevice',
        command: 'color',
        color: {
          red: 10,
          green: 100,
          blue: 50,
        },
      });
      assertColorRGB(
        10,
        100,
        50,
      );
    });
    it('processes DeviceState.command === colorwc', () => {
      assertColorRGB(
        undefined,
        undefined,
        undefined,
      );
      testMode.parse({
        deviceId: 'testDevice',
        command: 'colorwc',
        color: {
          red: 100,
          green: 10,
          blue: 5,
        },
      });
      assertColorRGB(
        100,
        10,
        5,
      );
    });
    it('processes DeviceState.commands', () => {
      expect(testMode.activeMode).toBeUndefined();
      assertColorRGB(
        undefined,
        undefined,
        undefined,
      );
      testMode.parse({
        deviceId: 'device',
        commands: [
          [
            REPORT_IDENTIFIER,
            5,
            testMode.colorModeIdentifier,
            10,
            1,
            255,
          ],
        ],
      });
      expect(testMode.activeMode).toBe(testMode.colorModeIdentifier);
      assertColorRGB(
        10,
        1,
        255,
      );
    });

    it('ignores non-applicable DeviceState', () => {
      assertColorRGB(
        undefined,
        undefined,
        undefined,
      );
      testMode.parse({
        deviceId: 'device',
        brightness: 100,
        commands: [
          [REPORT_IDENTIFIER, 1, 2],
        ],
      });
      assertColorRGB(
        undefined,
        undefined,
        undefined,
      );
    });

    it('ignores non-applicable DeviceState modeIdentifier', () => {
      assertColorRGB(
        undefined,
        undefined,
        undefined,
      );
      testMode.parse({
        deviceId: 'device',
        brightness: 100,
        commands: [
          [
            REPORT_IDENTIFIER,
            5,
            testMode.colorModeIdentifier + 4,
            10,
            1,
            255,
          ],
        ],
      });
      assertColorRGB(
        undefined,
        undefined,
        undefined,
      );
    });
  });

  describe('colorChange', () => {
    it('returns opcode array', () => {
      testMode.color = new ColorRGB(40, 10, 99);
      expect(testMode.colorChange()).toStrictEqual(
        [
          COMMAND_IDENTIFIER, 5, testMode.colorModeIdentifier, 40, 10,
          99, 0, 0, 0, 0,
          0, 0, 0, 0, 0,
          0, 0, 0, 0, 100,
        ],
      );
    });
  });
})
;
