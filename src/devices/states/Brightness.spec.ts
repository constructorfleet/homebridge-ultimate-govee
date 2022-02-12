import {State} from './State';
import {COMMAND_IDENTIFIER, REPORT_IDENTIFIER} from '../../util/const';
import {Brightness, BrightnessState} from './Brightness';

class TestState extends Brightness(State) {
  constructor(...args) {
    super(...args);
  }
}

let testState: BrightnessState & State;

describe('BrightnessState', () => {
  beforeEach(() => {
    testState = new TestState();
  });

  describe('constructor', () => {
    it('adds command identifier', () => {
      expect(testState.deviceStatusCodes).toHaveLength(1);
      expect(testState.deviceStatusCodes).toStrictEqual([[4]]);
    });
  });

  describe('parse', () => {
    it('processes DeviceState.brightness', () => {
      expect(testState.brightness).toBeUndefined();
      testState.parse({
        deviceId: 'device',
        brightness: 10,
      });
      expect(testState.brightness).toBe(10);
      testState.parse({
        deviceId: 'device',
        brightness: 72,
      });
      expect(testState.brightness).toBe(72);
    });

    it('processes DeviceState.commands', () => {
      expect(testState.brightness).toBeUndefined();
      testState.parse({
        deviceId: 'device',
        commands: [
          [REPORT_IDENTIFIER, 4, 10],
        ],
      });
      expect(testState.brightness).toBe(10);
      testState.parse({
        deviceId: 'device',
        commands: [
          [REPORT_IDENTIFIER, 4, 100],
        ],
      });
      expect(testState.brightness).toBe(100);
    });

    it('ignores non-applicable DeviceState', () => {
      expect(testState.brightness).toBeUndefined();
      testState.parse({
        deviceId: 'device',
        commands: [
          [REPORT_IDENTIFIER, 1, 2],
        ],
      });
      expect(testState.brightness).toBeUndefined();
    });
  });

  describe('brightnessChange', () => {
    it('returns opcode array', () => {
      testState.brightness = 22;
      expect(testState.brightnessChange).toStrictEqual(
        [
          COMMAND_IDENTIFIER, 4, 22, 0, 0,
          0, 0, 0, 0, 0,
          0, 0, 0, 0, 0,
          0, 0, 0, 0, 33,
        ],
      );
    });
  });
});