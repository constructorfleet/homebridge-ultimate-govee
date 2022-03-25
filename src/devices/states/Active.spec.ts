import {Active, ActiveState} from './Active';
import {State} from './State';
import {COMMAND_IDENTIFIER, REPORT_IDENTIFIER} from '../../util/const';

class TestState extends Active(State) {
  constructor(...args) {
    super(...args);
  }
}

let activeState: ActiveState & State;

describe('ActiveState', () => {
  beforeEach(() => {
    activeState = new TestState();
  });

  describe('constructor', () => {
    it('adds command identifier', () => {
      expect(activeState.deviceStatusCodes.size).toBe(1);
      expect(Array.from(activeState.deviceStatusCodes)).toStrictEqual([[1]]);
    });
  });

  describe('parse', () => {
    it('processes DeviceState.on', () => {
      expect(activeState.isActive).toBeUndefined();
      activeState.parse({
        deviceId: 'device',
        on: true,
      });
      expect(activeState.isActive).toBeTruthy();
      activeState.parse({
        deviceId: 'device',
        on: false,
      });
      expect(activeState.isActive).toBeFalsy();
    });

    it('processes DeviceState.commands', () => {
      expect(activeState.isActive).toBeUndefined();
      activeState.parse({
        deviceId: 'device',
        commands: [
          [REPORT_IDENTIFIER, 1, 1],
        ],
      });
      expect(activeState.isActive).toBeTruthy();
      activeState.parse({
        deviceId: 'device',
        commands: [
          [REPORT_IDENTIFIER, 1, 0],
        ],
      });
      expect(activeState.isActive).toBeFalsy();
    });

    it('ignores non-applicable DeviceState', () => {
      expect(activeState.isActive).toBeUndefined();
      activeState.parse({
        deviceId: 'device',
        brightness: 100,
        commands: [
          [REPORT_IDENTIFIER, 5, 2],
        ],
      });
      expect(activeState.isActive).toBeUndefined();
    });
  });

  describe('activeStateChange', () => {
    it('returns opcode array', () => {
      activeState.isActive = true;
      expect(activeState.activeStateChange).toStrictEqual(
        [
          COMMAND_IDENTIFIER, 1, 1, 0, 0,
          0, 0, 0, 0, 0,
          0, 0, 0, 0, 0,
          0, 0, 0, 0, 51,
        ],
      );
    });
  });
});