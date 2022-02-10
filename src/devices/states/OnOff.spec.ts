import {State} from './State';
import {REPORT_IDENTIFIER} from '../../util/const';
import {OnOff, OnOffState} from './OnOff';

class TestState extends OnOff(State) {
  constructor(...args) {
    super(...args);
  }
}

let activeState: OnOffState & State;

describe('OnOffState', () => {
  beforeEach(() => {
    activeState = new TestState();
  });

  describe('constructor', () => {
    it('adds command identifier', () => {
      expect(activeState.deviceStatusCodes).toHaveLength(0);
      expect(activeState.deviceStatusCodes).toStrictEqual([]);
    });
  });

  describe('parse', () => {
    it('processes DeviceState.on', () => {
      expect(activeState.isOn).toBeUndefined();
      activeState.parse({
        deviceId: 'device',
        on: true,
      });
      expect(activeState.isOn).toBeTruthy();
      activeState.parse({
        deviceId: 'device',
        on: false,
      });
      expect(activeState.isOn).toBeFalsy();
    });

    it('ignores non-applicable DeviceState', () => {
      expect(activeState.isOn).toBeUndefined();
      activeState.parse({
        deviceId: 'device',
        brightness: 100,
        commands: [
          [REPORT_IDENTIFIER, 5, 2],
        ],
      });
      expect(activeState.isOn).toBeUndefined();
    });
  });
});