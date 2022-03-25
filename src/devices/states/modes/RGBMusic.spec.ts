import {COMMAND_IDENTIFIER, REPORT_IDENTIFIER} from '../../../util/const';
import {RGBMusicMode, RGBMusicModeState} from './RGBMusic';
import {State} from '../State';

type AssertChain<ArgumentType> = (actual: ArgumentType, expected: ArgumentType) => AssertChain<ArgumentType>;

class TestMode extends RGBMusicMode(State) {
  constructor() {
    super({
      rgbMusicModeIdentifier: 19,
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

let testMode: RGBMusicModeState & State;

describe('RGBMusicMode', () => {
  beforeEach(() => {
    testMode = new TestMode();
  });

  describe('parse', () => {
    it('processes DeviceState.commands', () => {
      expect(testMode.musicModeType).toBeUndefined();
      expect(testMode.sensitivity).toBeUndefined();
      testMode.parse({
        deviceId: 'device',
        commands: [
          [REPORT_IDENTIFIER, 5, 19, 3, 36, 1, 1, 50, 100, 255, 0, 0, 0, 0, 0],
        ],
      });
      expect(testMode.musicModeType).toBe(3);
      expect(testMode.sensitivity).toBe(36);
    });

    it('ignores non-applicable DeviceState', () => {
      expect(testMode.musicModeType).toBeUndefined();
      expect(testMode.sensitivity).toBeUndefined();
      testMode.parse({
        deviceId: 'device',
        brightness: 100,
        commands: [
          [REPORT_IDENTIFIER, 1, 2],
        ],
      });
      expect(testMode.musicModeType).toBeUndefined();
      expect(testMode.sensitivity).toBeUndefined();
    });
  });

  describe('rgbMusicChange', () => {
    it('returns opcode array', () => {
      testMode.musicModeType = 5;
      testMode.sensitivity = 50;
      expect(testMode.rgbMusicChange()).toStrictEqual(
        [
          COMMAND_IDENTIFIER, 5, 19, testMode.musicModeType, testMode.sensitivity,
          0, 0, 0, 0, 0,
          0, 0, 0, 0, 0,
          0, 0, 0, 0, 18,
        ],
      );
    });
  });
});