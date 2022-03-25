import {State} from './State';
import {REPORT_IDENTIFIER} from '../../util/const';
import {OnOff, OnOffState} from './OnOff';

class TestState extends OnOff(State) {
  constructor(...args) {
    super(...args);
  }
}

let testState: OnOffState & State;

describe('OnOffState', () => {
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
    it('processes DeviceState.on', () => {
      expect(testState.isOn).toBeUndefined();
      testState.parse({
        deviceId: 'device',
        on: true,
      });
      expect(testState.isOn).toBeTruthy();
      testState.parse({
        deviceId: 'device',
        on: false,
      });
      expect(testState.isOn).toBeFalsy();
    });

    it('ignores non-applicable DeviceState', () => {
      expect(testState.isOn).toBeUndefined();
      testState.parse({
        deviceId: 'device',
        brightness: 100,
        commands: [
          [REPORT_IDENTIFIER, 5, 2],
        ],
      });
      expect(testState.isOn).toBeUndefined();
    });
  });
});