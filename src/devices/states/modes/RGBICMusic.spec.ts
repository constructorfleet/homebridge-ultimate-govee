import {COMMAND_IDENTIFIER, REPORT_IDENTIFIER} from '../../../util/const';
import {ColorMode, IntensityMode, MusicModeType, RGBICMusicMode} from './RGBICMusic';

let testMode: RGBICMusicMode;

describe('MusicMode', () => {
  beforeEach(() => {
    testMode = new RGBICMusicMode();
  });

  describe('parse', () => {
    it('processes DeviceState.commands', () => {
      expect(testMode.musicModeType).toBe(MusicModeType.ENERGETIC);
      expect(testMode.sensitivity).toBe(0);
      expect(testMode.intensity).toBe(IntensityMode.DYNAMIC);
      expect(testMode.colorMode).toBe(ColorMode.AUTOMATIC);
      expect(testMode.specifiedColor.red).toBe(0);
      expect(testMode.specifiedColor.green).toBe(0);
      expect(testMode.specifiedColor.blue).toBe(0);
      testMode.parse({
        deviceId: 'device',
        commands: [
          [REPORT_IDENTIFIER, 5, 19, 3, 36, 1, 1, 50, 100, 255, 0, 0, 0, 0, 0],
        ],
      });
      expect(testMode.musicModeType).toBe(MusicModeType.RHYTHM);
      expect(testMode.sensitivity).toBe(36);
      expect(testMode.intensity).toBe(IntensityMode.CALM);
      expect(testMode.colorMode).toBe(ColorMode.SPECIFIED);
      expect(testMode.specifiedColor.red).toBe(50);
      expect(testMode.specifiedColor.green).toBe(100);
      expect(testMode.specifiedColor.blue).toBe(255);
    });

    it('ignores non-applicable DeviceState', () => {
      expect(testMode.musicModeType).toBe(MusicModeType.ENERGETIC);
      expect(testMode.sensitivity).toBe(0);
      expect(testMode.intensity).toBe(IntensityMode.DYNAMIC);
      expect(testMode.colorMode).toBe(ColorMode.AUTOMATIC);
      expect(testMode.specifiedColor.red).toBe(0);
      expect(testMode.specifiedColor.green).toBe(0);
      expect(testMode.specifiedColor.blue).toBe(0);
      testMode.parse({
        deviceId: 'device',
        brightness: 100,
        commands: [
          [REPORT_IDENTIFIER, 1, 2],
        ],
      });
      expect(testMode.musicModeType).toBe(MusicModeType.ENERGETIC);
      expect(testMode.sensitivity).toBe(0);
      expect(testMode.intensity).toBe(IntensityMode.DYNAMIC);
      expect(testMode.colorMode).toBe(ColorMode.AUTOMATIC);
      expect(testMode.specifiedColor.red).toBe(0);
      expect(testMode.specifiedColor.green).toBe(0);
      expect(testMode.specifiedColor.blue).toBe(0);
    });
  });

  describe('musicChange', () => {
    it('returns opcode array', () => {
      testMode.musicModeType = MusicModeType.ENERGETIC;
      testMode.sensitivity = 50;
      testMode.intensity = IntensityMode.CALM;
      testMode.colorMode = ColorMode.AUTOMATIC;
      testMode.specifiedColor.red = 50;
      testMode.specifiedColor.green = 100;
      testMode.specifiedColor.blue = 255;
      expect(testMode.musicChange()).toStrictEqual(
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