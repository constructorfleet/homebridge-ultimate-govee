import {COMMAND_IDENTIFIER, REPORT_IDENTIFIER} from '../../../util/const';
import {RGBMusicMode} from './RGBMusic';

let testMode: RGBMusicMode;

describe('RGBMusicMode', () => {
  beforeEach(() => {
    testMode = new RGBMusicMode();
  });

  describe('parse', () => {
    it('processes DeviceState.commands', () => {
      expect(testMode.musicModeType).toBe(0);
      expect(testMode.sensitivity).toBe(0);
      testMode.parse({
        deviceId: 'device',
        commands: [
          [REPORT_IDENTIFIER, 5, 14, 3, 36, 1, 1, 50, 100, 255, 0, 0, 0, 0, 0],
        ],
      });
      expect(testMode.musicModeType).toBe(3);
      expect(testMode.sensitivity).toBe(36);
    });

    it('ignores non-applicable DeviceState', () => {
      expect(testMode.musicModeType).toBe(0);
      expect(testMode.sensitivity).toBe(0);
      testMode.parse({
        deviceId: 'device',
        brightness: 100,
        commands: [
          [REPORT_IDENTIFIER, 1, 2],
        ],
      });
      expect(testMode.musicModeType).toBe(0);
      expect(testMode.sensitivity).toBe(0);
    });
  });

  describe('musicChange', () => {
    it('returns opcode array', () => {
      testMode.musicModeType = 5;
      testMode.sensitivity = 50;
      expect(testMode.musicChange()).toStrictEqual(
        [
          COMMAND_IDENTIFIER, 5, 14, testMode.musicModeType, testMode.sensitivity,
          0, 0, 0, 0, 0,
          0, 0, 0, 0, 0,
          0, 0, 0, 0, 15,
        ],
      );
    });
  });
});