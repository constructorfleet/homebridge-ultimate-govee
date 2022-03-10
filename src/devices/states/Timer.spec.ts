import {State} from './State';
import {REPORT_IDENTIFIER} from '../../util/const';
import {Timer, TimerState} from './Timer';

class TestState extends Timer(State) {
  constructor(...args) {
    super(...args);
  }
}

let testState: TimerState & State;

describe('TimerState', () => {
  beforeEach(() => {
    testState = new TestState();
  });

  describe('constructor', () => {
    it('adds command identifier', () => {
      expect(testState.deviceStatusCodes.size).toBe(1);
      expect(Array.from(testState.deviceStatusCodes)).toStrictEqual([[11]]);
    });
  });

  describe('parse', () => {
    it('processes DeviceState.commands', () => {
      expect(testState.timerOn).toBeUndefined();
      expect(testState.timerDuration).toBeUndefined();
      testState.parse({
        deviceId: 'device',
        commands: [
          [REPORT_IDENTIFIER, 11, 1, 0, 100],
        ],
      });
      expect(testState.timerOn).toBeTruthy();
      expect(testState.timerDuration).toBe(100);
      testState.parse({
        deviceId: 'device',
        commands: [
          [REPORT_IDENTIFIER, 11, 0, 1, 0],
        ],
      });
      expect(testState.timerOn).toBeFalsy();
      expect(testState.timerDuration).toBe(255);
    });

    it('ignores non-applicable DeviceState', () => {
      expect(testState.timerOn).toBeUndefined();
      expect(testState.timerDuration).toBeUndefined();
      testState.parse({
        deviceId: 'device',
        brightness: 100,
        commands: [
          [REPORT_IDENTIFIER, 1, 2],
        ],
      });
      expect(testState.timerOn).toBeUndefined();
      expect(testState.timerDuration).toBeUndefined();
    });
  });
});