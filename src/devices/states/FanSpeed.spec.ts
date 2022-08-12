import {State} from './State';
import {COMMAND_IDENTIFIER, REPORT_IDENTIFIER} from '../../util/const';
import {FanSpeed, FanSpeedState} from './FanSpeed';

class TestState extends FanSpeed(State) {
  constructor(...args) {
    super(...args);
  }
}

let testState: FanSpeedState & State;

describe('FanSpeedState', () => {
  beforeEach(() => {
    testState = new TestState();
  });

  describe('constructor', () => {
    it('adds command identifier', () => {
      expect(testState.deviceStatusCodes.size).toBe(1);
      expect(Array.from(testState.deviceStatusCodes)).toStrictEqual([[5]]);
    });
  });

  describe('parse', () => {
    it('processes DeviceState.commands', () => {
      expect(testState.fanSpeed).toBeUndefined();
      testState.parse({
        deviceId: 'device',
        commands: [
          [REPORT_IDENTIFIER, 5, 1],
        ],
      });
      expect(testState.fanSpeed).toBe(1);
      testState.parse({
        deviceId: 'device',
        commands: [
          [REPORT_IDENTIFIER, 5, 8],
        ],
      });
      expect(testState.fanSpeed).toBe(8);
    });

    it('ignores non-applicable DeviceState', () => {
      expect(testState.fanSpeed).toBeUndefined();
      testState.parse({
        deviceId: 'device',
        brightness: 100,
        commands: [
          [REPORT_IDENTIFIER, 1, 2],
        ],
      });
      expect(testState.fanSpeed).toBeUndefined();
    });
  });

  describe('fanSpeedChange', () => {
    it('returns opcode array', () => {
      testState.fanSpeed = 5;
      expect(testState.fanSpeedChange).toStrictEqual(
        [
          COMMAND_IDENTIFIER, 5, 5, 0, 0,
          0, 0, 0, 0, 0,
          0, 0, 0, 0, 0,
          0, 0, 0, 0, 51,
        ],
      );
    });
  });
});
