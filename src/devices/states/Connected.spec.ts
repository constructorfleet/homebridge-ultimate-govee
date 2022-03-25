import {State} from './State';
import {REPORT_IDENTIFIER} from '../../util/const';
import {Connected, ConnectedState} from './Connected';

class TestState extends Connected(State) {
  constructor(...args) {
    super(...args);
  }
}

let testState: ConnectedState & State;

describe('ConnectionState', () => {
  beforeEach(() => {
    testState = new TestState();
  });

  describe('constructor', () => {
    it('adds command identifier', () => {
      expect(testState.deviceStatusCodes.size).toBe(0);
      expect(Array.from(testState.deviceStatusCodes)).toStrictEqual([]);
    });
  });

  describe('parse', () => {
    it('processes DeviceState.connected', () => {
      expect(testState.isConnected).toBeUndefined();
      testState.parse({
        deviceId: 'device',
        connected: true,
      });
      expect(testState.isConnected).toBeTruthy();
      testState.parse({
        deviceId: 'device',
        connected: false,
      });
      expect(testState.isConnected).toBeFalsy();
    });

    it('ignores non-applicable DeviceState', () => {
      expect(testState.isConnected).toBeUndefined();
      testState.parse({
        deviceId: 'device',
        brightness: 100,
        commands: [
          [REPORT_IDENTIFIER, 5, 2],
        ],
      });
      expect(testState.isConnected).toBeUndefined();
    });
  });
});