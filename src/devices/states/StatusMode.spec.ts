import {State} from './State';
import {REPORT_IDENTIFIER} from '../../util/const';
import {StatusMode, StatusModeState} from './StatusMode';

class TestState extends StatusMode(State) {
  constructor(...args) {
    super(...args);
  }
}

let testState: StatusModeState & State;

describe('StatusModeState', () => {
  beforeEach(() => {
    testState = new TestState();
  });

  describe('constructor', () => {
    it('adds command identifier', () => {
      expect(testState.deviceStatusCodes).toHaveLength(1);
      expect(testState.deviceStatusCodes).toStrictEqual([[5, 0]]);
    });
  });

  describe('parse', () => {
    it('processes DeviceState.mode', () => {
      expect(testState.subStatusMode).toBeUndefined();
      testState.parse({
        deviceId: 'device',
        mode: 10,
      });
      expect(testState.statusMode).toBe(10);
      testState.parse({
        deviceId: 'device',
        mode: 23,
      });
      expect(testState.statusMode).toBe(23);
    });

    it('processes DeviceState.commands', () => {
      expect(testState.statusMode).toBeUndefined();
      testState.parse({
        deviceId: 'device',
        commands: [
          [REPORT_IDENTIFIER, 5, 0, 4],
        ],
      });
      expect(testState.statusMode).toBe(4);
      testState.parse({
        deviceId: 'device',
        commands: [
          [REPORT_IDENTIFIER, 5, 0, 1],
        ],
      });
      expect(testState.statusMode).toBe(1);
    });

    it('ignores non-applicable DeviceState', () => {
      expect(testState.statusMode).toBeUndefined();
      testState.parse({
        deviceId: 'device',
        brightness: 100,
        commands: [
          [REPORT_IDENTIFIER, 1, 2],
        ],
      });
      expect(testState.statusMode).toBeUndefined();
    });
  });
});