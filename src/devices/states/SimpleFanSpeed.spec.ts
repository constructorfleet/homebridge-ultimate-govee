import {State} from './State';
import { SimpleFanSpeed, SimpleFanSpeedState } from './SimpleFanSpeed';
import {COMMAND_IDENTIFIER, REPORT_IDENTIFIER} from '../../util/const';

class TestState extends SimpleFanSpeed(State) {
  constructor(...args) {
    super(...args);
  }
}

let testState: SimpleFanSpeedState & State;

describe('SimpleFanSpeedState', () => {
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
      expect(testState.simpleFanSpeed).toBeUndefined();
      testState.parse({
        deviceId: 'device',
        commands: [
          [REPORT_IDENTIFIER, 5, 1, 1],
        ],
      });
      expect(testState.simpleFanSpeed).toBe(1);
      testState.parse({
        deviceId: 'device',
        commands: [
          [REPORT_IDENTIFIER, 5, 1, 3],
        ],
      });
      expect(testState.simpleFanSpeed).toBe(3);
    });

    it('ignores non-applicable DeviceState', () => {
      expect(testState.simpleFanSpeed).toBeUndefined();
      testState.parse({
        deviceId: 'device',
        brightness: 100,
        commands: [
          [REPORT_IDENTIFIER, 1, 2],
        ],
      });
      expect(testState.simpleFanSpeed).toBeUndefined();
    });
  });

  describe('fanSpeedChange', () => {
    it('returns opcode array', () => {
      testState.simpleFanSpeed = 2;
      expect(testState.simpleFanSpeedChange).toStrictEqual(
        [
          COMMAND_IDENTIFIER, 5, 1, 2, 0,
          0, 0, 0, 0, 0,
          0, 0, 0, 0, 0,
          0, 0, 0, 0, 53,
        ],
      );
    });
  });
});