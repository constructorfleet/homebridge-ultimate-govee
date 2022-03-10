import {COMMAND_IDENTIFIER, REPORT_IDENTIFIER} from '../../../util/const';
import {ColorMode, IntensityMode, RGBICMusicMode, RGBICMusicModeState} from './RGBICMusic';
import {State} from '../State';

type AssertChain<ArgumentType> = (actual: ArgumentType, expected: ArgumentType) => AssertChain<ArgumentType>;

class TestMode extends RGBICMusicMode(State) {
  constructor() {
    super({
      rgbicMusicModeIdentifier: 19,
      deviceConfig: {
        name: 'TestDevice',
        deviceId: 'device',
        model: 'H1234',
        pactType: 1,
        pactCode: 2,
        goodsType: 21,
      },
    });
  }
}

let testMode: RGBICMusicModeState & State;

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
    testMode.specifiedColor?.red,
    red,
  )(
    testMode.specifiedColor?.green,
    green,
  )(
    testMode.specifiedColor?.blue,
    blue,
  );
};

describe('RGBICMusicMode', () => {
  beforeEach(() => {
    testMode = new TestMode();
  });

  describe('parse', () => {
    it('processes DeviceState.commands', () => {
      assertColorRGB(0, 0, 0);
      expect(testMode.musicModeType).toBeUndefined();
      expect(testMode.sensitivity).toBeUndefined();
      expect(testMode.intensity).toBe(IntensityMode.DYNAMIC);
      expect(testMode.colorMode).toBe(ColorMode.AUTOMATIC);
      testMode.parse({
        deviceId: 'device',
        commands: [
          [REPORT_IDENTIFIER, 5, 19, 3, 36, 1, 1, 50, 100, 255, 0, 0, 0, 0, 0],
        ],
      });
      expect(testMode.musicModeType).toBe(3);
      expect(testMode.sensitivity).toBe(36);
      expect(testMode.intensity).toBe(IntensityMode.CALM);
      expect(testMode.colorMode).toBe(ColorMode.SPECIFIED);
      assertColorRGB(50, 100, 255);
    });

    it('ignores non-applicable DeviceState', () => {
      assertColorRGB(0, 0, 0);
      expect(testMode.musicModeType).toBeUndefined();
      expect(testMode.intensity).toBe(IntensityMode.DYNAMIC);
      expect(testMode.colorMode).toBe(ColorMode.AUTOMATIC);
      testMode.parse({
        deviceId: 'device',
        brightness: 100,
        commands: [
          [REPORT_IDENTIFIER, 1, 2],
        ],
      });
      assertColorRGB(0, 0, 0);
      expect(testMode.musicModeType).toBeUndefined();
      expect(testMode.intensity).toBe(IntensityMode.DYNAMIC);
      expect(testMode.colorMode).toBe(ColorMode.AUTOMATIC);
    });
  });

  describe('musicChange', () => {
    it('returns opcode array', () => {
      testMode.musicModeType = 5;
      testMode.sensitivity = 50;
      testMode.intensity = IntensityMode.CALM;
      testMode.colorMode = ColorMode.AUTOMATIC;
      testMode.specifiedColor.red = 50;
      testMode.specifiedColor.green = 100;
      testMode.specifiedColor.blue = 255;
      expect(testMode.rgbicMusicChange()).toStrictEqual(
        [
          COMMAND_IDENTIFIER, 5, 19, testMode.musicModeType, testMode.sensitivity,
          testMode.intensity, testMode.colorMode, testMode.specifiedColor.red,
          testMode.specifiedColor.green, testMode.specifiedColor.blue,
          0, 0, 0, 0, 0,
          0, 0, 0, 0, 186,
        ],
      );
    });
  });
});