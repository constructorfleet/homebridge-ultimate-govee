import {State} from './State';
import {COMMAND_IDENTIFIER, REPORT_IDENTIFIER} from '../../util/const';
import {ColorRGB} from '../../util/colorUtils';
import {ColorSegments, ColorSegmentsState} from './ColorSegments';
import {arrayReplace} from '../../util/arrayUtils';

class TestState extends ColorSegments(State) {
  constructor(...args) {
    super(...args);
  }
}

let testState: ColorSegmentsState & State;

describe('ColorSegmentsState', () => {
  beforeEach(() => {
    testState = new TestState();
  });

  describe('constructor', () => {
    it('adds command identifier', () => {
      expect(testState.deviceStatusCodes).toHaveLength(1);
      expect(testState.deviceStatusCodes).toStrictEqual([[5, 11]]);
    });
  });

  describe('parse', () => {
    it('processes DeviceState.commands', () => {
      expect(testState.colorSegmentsChange).toBeUndefined();
      testState.parse({
        deviceId: 'device',
        commands: [
          [REPORT_IDENTIFIER, 5, 11, 10, 50, 255, 0, 0, 5, 0],
        ],
      });
      expect(testState.colorSegmentsChange).toBeDefined();
      const colorSegments = arrayReplace(arrayReplace(new Array(15).fi))
        [1, 3].forEach(
          (idx) => {
            const color = testState.colorSegments[idx];
            expe;
          },
        );

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