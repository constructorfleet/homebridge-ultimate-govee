import {State} from './State';
import {COMMAND_IDENTIFIER, REPORT_IDENTIFIER} from '../../util/const';
import {Modes, ModesState} from './Modes';

class TestState extends Modes()(State) {
  constructor(...args) {
    super(...args);
  }
}

let testState: ModesState & State;

describe('ModeState', () => {
  beforeEach(() => {
    testState = new TestState();
  });

  describe('constructor', () => {
    it('adds command identifier', () => {
      expect(testState.deviceStatusCodes).toHaveLength(1);
      expect(testState.deviceStatusCodes).toStrictEqual([[5]]);
    });
  });

  describe('parse', () => {
    it('processes DeviceState.mode', () => {
      expect(testState.activeMode).toBeUndefined();
      testState.parse({
        deviceId: 'device',
        mode: 10,
      });
      expect(testState.activeMode).toBe(10);
    });

    it('processes DeviceState.commands', () => {
      expect(testState.activeMode).toBeUndefined();
      testState.parse({
        deviceId: 'device',
        commands: [
          [REPORT_IDENTIFIER, 5, 21],
        ],
      });
      expect(testState.activeMode).toBe(21);
      testState.parse({
        deviceId: 'device',
        commands: [
          [REPORT_IDENTIFIER, 5, 2],
        ],
      });
      expect(testState.activeMode).toBe(2);
    });

    it('ignores non-applicable DeviceState', () => {
      expect(testState.activeMode).toBeUndefined();
      testState.parse({
        deviceId: 'device',
        brightness: 100,
        commands: [
          [REPORT_IDENTIFIER, 1, 2],
        ],
      });
      expect(testState.activeMode).toBeUndefined();
    });
  });

  describe('mode', () => {
    it('returns opcode array', () => {
      testState.activeMode = 19;
      expect(testState.modeChange).toStrictEqual(
        [
          COMMAND_IDENTIFIER, 5, 19, 0, 0,
          0, 0, 0, 0, 0,
          0, 0, 0, 0, 0,
          0, 0, 0, 0, 37,
        ],
      );
    });
  });
});