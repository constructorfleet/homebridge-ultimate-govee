import {State} from './State';
import {COMMAND_IDENTIFIER, REPORT_IDENTIFIER} from '../../util/const';
import {MusicMode, MusicModeState, MusicModeType} from './MusicMode';

class TestState extends MusicMode(State) {
  constructor(...args) {
    super(...args);
  }
}

let testState: MusicModeState & State;

describe('MusicModeState', () => {
  beforeEach(() => {
    testState = new TestState();
  });

  describe('constructor', () => {
    it('adds command identifier', () => {
      expect(testState.deviceStatusCodes).toHaveLength(1);
      expect(testState.deviceStatusCodes).toStrictEqual([[5, 1]]);
    });
  });

  describe('parse', () => {
    it('processes DeviceState.commands', () => {
      expect(testState.musicMode).toBeUndefined();
      expect(testState.musicModeRed).toBeUndefined();
      expect(testState.musicModeGreen).toBeUndefined();
      expect(testState.musicModeBlue).toBeUndefined();
      testState.parse({
        deviceId: 'device',
        commands: [
          [REPORT_IDENTIFIER, 5, 1, 1, 0, 255, 0, 0],
        ],
      });
      expect(testState.musicMode).toBe(MusicModeType.SPECTRUM);
      expect(testState.musicModeRed).toBe(255);
      expect(testState.musicModeGreen).toBe(0);
      expect(testState.musicModeBlue).toBe(0);
      testState.parse({
        deviceId: 'device',
        commands: [
          [REPORT_IDENTIFIER, 5, 1, 0, 0, 0, 255, 0],
        ],
      });
      expect(testState.musicMode).toBe(MusicModeType.ENERGETIC);
      expect(testState.musicModeRed).toBe(0);
      expect(testState.musicModeGreen).toBe(255);
      expect(testState.musicModeBlue).toBe(0);
    });

    it('ignores non-applicable DeviceState', () => {
      expect(testState.musicMode).toBeUndefined();
      expect(testState.musicModeRed).toBeUndefined();
      expect(testState.musicModeGreen).toBeUndefined();
      expect(testState.musicModeBlue).toBeUndefined();
      testState.parse({
        deviceId: 'device',
        brightness: 100,
        commands: [
          [REPORT_IDENTIFIER, 1, 2],
        ],
      });
      expect(testState.musicMode).toBeUndefined();
      expect(testState.musicModeRed).toBeUndefined();
      expect(testState.musicModeGreen).toBeUndefined();
      expect(testState.musicModeBlue).toBeUndefined();
    });
  });

  describe('musicModeChange', () => {
    it('returns opcode array', () => {
      testState.musicMode = MusicModeType.RHYTHM;
      testState.musicModeRed = 20;
      testState.musicModeGreen = 80;
      testState.musicModeBlue = 40;
      expect(testState.musicModeChange).toStrictEqual(
        [
          COMMAND_IDENTIFIER, 5, 1, 3, 0,
          20, 80, 40, 0, 0,
          0, 0, 0, 0, 0,
          0, 0, 0, 0, 88,
        ],
      );
    });
  });
});