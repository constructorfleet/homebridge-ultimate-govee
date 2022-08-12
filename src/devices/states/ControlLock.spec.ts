import {State} from './State';
import {COMMAND_IDENTIFIER, REPORT_IDENTIFIER} from '../../util/const';
import {ControlLock, ControlLockState} from './ControlLock';

class TestState extends ControlLock(State) {
  constructor(...args) {
    super(...args);
  }
}

let testState: ControlLockState & State;

describe('ControlLockState', () => {
  beforeEach(() => {
    testState = new TestState();
  });

  describe('constructor', () => {
    it('adds command identifier', () => {
      expect(testState.deviceStatusCodes.size).toBe(1);
      expect(Array.from(testState.deviceStatusCodes)).toStrictEqual([[10]]);
    });
  });

  describe('parse', () => {
    it('processes DeviceState.commands', () => {
      expect(testState.areControlsLocked).toBeUndefined();
      testState.parse({
        deviceId: 'device',
        commands: [
          [REPORT_IDENTIFIER, 10, 1],
        ],
      });
      expect(testState.areControlsLocked).toBeTruthy();
      testState.parse({
        deviceId: 'device',
        commands: [
          [REPORT_IDENTIFIER, 10, 0],
        ],
      });
      expect(testState.areControlsLocked).toBeFalsy();
    });

    it('ignores non-applicable DeviceState', () => {
      expect(testState.areControlsLocked).toBeUndefined();
      testState.parse({
        deviceId: 'device',
        brightness: 100,
        commands: [
          [REPORT_IDENTIFIER, 5, 2],
        ],
      });
      expect(testState.areControlsLocked).toBeUndefined();
    });
  });

  describe('controlLockChange', () => {
    it('returns opcode array', () => {
      testState.areControlsLocked = true;
      expect(testState.controlLockChange).toStrictEqual(
          [
            COMMAND_IDENTIFIER, 10, 1, 0, 0,
            0, 0, 0, 0, 0,
            0, 0, 0, 0, 0,
            0, 0, 0, 0, 56,
          ],
      );
    });
  });
});
