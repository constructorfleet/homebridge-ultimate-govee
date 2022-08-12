import {State} from './State';
import {COMMAND_IDENTIFIER, REPORT_IDENTIFIER} from '../../util/const';
import {MistLevel, MistLevelState} from './MistLevel';

class TestState extends MistLevel(State) {
  constructor(...args) {
    super(...args);
  }
}

let testState: MistLevelState & State;

describe('MistLevelState', () => {
  beforeEach(() => {
    testState = new TestState();
  });

  describe('constructor', () => {
    it('adds command identifier', () => {
      expect(testState.deviceStatusCodes.size).toBe(1);
      expect(Array.from(testState.deviceStatusCodes)).toStrictEqual([[5, 1]]);
    });
  });

  describe('parse', () => {
    it('processes DeviceState.commands', () => {
      expect(testState.mistLevel).toBeUndefined();
      testState.parse({
        deviceId: 'device',
        commands: [
          [REPORT_IDENTIFIER, 5, 1, 1],
        ],
      });
      expect(testState.mistLevel).toBe(1);
      testState.parse({
        deviceId: 'device',
        commands: [
          [REPORT_IDENTIFIER, 5, 1, 5],
        ],
      });
      expect(testState.mistLevel).toBe(5);
    });

    it('ignores non-applicable DeviceState', () => {
      expect(testState.mistLevel).toBeUndefined();
      testState.parse({
        deviceId: 'device',
        brightness: 100,
        commands: [
          [REPORT_IDENTIFIER, 1, 2],
        ],
      });
      expect(testState.mistLevel).toBeUndefined();
    });
  });

  describe('mistLevelChange', () => {
    it('returns opcode array', () => {
      testState.mistLevel = 5;
      expect(testState.mistLevelChange).toStrictEqual(
        [
          COMMAND_IDENTIFIER, 5, 1, 5, 0,
          0, 0, 0, 0, 0,
          0, 0, 0, 0, 0,
          0, 0, 0, 0, 50,
        ],
      );
    });
  });
});
