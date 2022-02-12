import {State} from './State';
import {COMMAND_IDENTIFIER, REPORT_IDENTIFIER} from '../../util/const';
import {ColorRGB} from '../../util/colorUtils';
import {SolidColor, SolidColorState} from './SolidColor';

class TestState extends SolidColor(State) {
  constructor(...args) {
    super(...args);
  }
}

let testState: SolidColorState & State;

describe('SolidColorState', () => {
  beforeEach(() => {
    testState = new TestState();
  });

  describe('constructor', () => {
    it('adds command identifier', () => {
      expect(testState.deviceStatusCodes).toHaveLength(1);
      expect(testState.deviceStatusCodes).toStrictEqual([[5, 2]]);
    });
  });

  describe('parse', () => {
    it('processes DeviceState.commands', () => {
      expect(testState.solidColor).toBeUndefined();
      testState.parse({
        deviceId: 'device',
        commands: [
          [REPORT_IDENTIFIER, 5, 2, 10, 50, 255],
        ],
      });
      expect(testState.solidColor).toBeDefined();
      expect(testState.solidColor?.red).toBe(10);
      expect(testState.solidColor?.green).toBe(50);
      expect(testState.solidColor?.blue).toBe(255);
    });

    it('ignores non-applicable DeviceState', () => {
      expect(testState.solidColor).toBeUndefined();
      testState.parse({
        deviceId: 'device',
        brightness: 100,
        commands: [
          [REPORT_IDENTIFIER, 1, 2],
        ],
      });
      expect(testState.solidColor).toBeUndefined();
    });
  });

  describe('solidColorChange', () => {
    it('returns opcode array', () => {
      testState.solidColor = new ColorRGB(
        20,
        80,
        40,
      );
      expect(testState.solidColorChange).toStrictEqual(
        [
          COMMAND_IDENTIFIER, 5, 2, 20, 80,
          40, 0, 255, 174, 84,
          0, 0, 0, 0, 0,
          0, 0, 0, 0, 93,
        ],
      );
    });
  });
});