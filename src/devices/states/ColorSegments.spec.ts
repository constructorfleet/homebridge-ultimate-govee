import {State} from './State';
import {REPORT_IDENTIFIER} from '../../util/const';
import {ColorSegments, ColorSegmentsState} from './ColorSegments';

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
    it('processes DeviceState.commands 1 match', () => {
      expect(testState.colorSegments).toHaveLength(15);
      testState.colorSegments.forEach(
        (segment) => {
          expect(segment.red).toBe(0);
          expect(segment.green).toBe(0);
          expect(segment.blue).toBe(0);
        },
      );
      testState.parse({
        deviceId: 'device',
        commands: [
          [REPORT_IDENTIFIER, 5, 11, 10, 50, 255, 0, 0, 5, 0],
        ],
      });
      expect(testState.colorSegments).toHaveLength(15);
      for (let i = 0; i < testState.colorSegments.length; i++) {
        const color = testState.colorSegments[i];
        if ([0, 2].includes(i)) {
          expect(color).toBeDefined();
          expect(color?.red).toBe(10);
          expect(color?.green).toBe(50);
          expect(color?.blue).toBe(255);
        } else {
          expect(color).toBeDefined();
          expect(color?.red).toBe(0);
          expect(color?.green).toBe(0);
          expect(color?.blue).toBe(0);
        }
      }
    });

    it('processes DeviceState.commands 2 match', () => {
      expect(testState.colorSegments).toHaveLength(15);
      testState.colorSegments.forEach(
        (segment) => {
          expect(segment.red).toBe(0);
          expect(segment.green).toBe(0);
          expect(segment.blue).toBe(0);
        },
      );
      testState.parse({
        deviceId: 'device',
        commands: [
          [REPORT_IDENTIFIER, 5, 11, 10, 50, 255, 0, 0, 5, 0],
          [REPORT_IDENTIFIER, 5, 11, 100, 101, 150, 0, 0, 0, 8],
        ],
      });
      expect(testState.colorSegments).toHaveLength(15);
      for (let i = 0; i < testState.colorSegments.length; i++) {
        const color = testState.colorSegments[i];
        if ([0, 2].includes(i)) {
          expect(color).toBeDefined();
          expect(color?.red).toBe(10);
          expect(color?.green).toBe(50);
          expect(color?.blue).toBe(255);
        } else if ([11].includes(i)) {
          expect(color).toBeDefined();
          expect(color?.red).toBe(100);
          expect(color?.green).toBe(101);
          expect(color?.blue).toBe(150);
        } else {
          expect(color).toBeDefined();
          expect(color?.red).toBe(0);
          expect(color?.green).toBe(0);
          expect(color?.blue).toBe(0);
        }
      }
    });

    it('ignores non-applicable DeviceState', () => {
      expect(testState.colorSegments).toHaveLength(15);
      testState.colorSegments.forEach(
        (segment) => {
          expect(segment.red).toBe(0);
          expect(segment.green).toBe(0);
          expect(segment.blue).toBe(0);
        },
      );
      testState.parse({
        deviceId: 'device',
        brightness: 100,
        commands: [
          [REPORT_IDENTIFIER, 1, 2],
        ],
      });
      expect(testState.colorSegments).toHaveLength(15);
      testState.colorSegments.forEach(
        (segment) => {
          expect(segment.red).toBe(0);
          expect(segment.green).toBe(0);
          expect(segment.blue).toBe(0);
        },
      );
    });
  });

  // describe('solidColorChange', () => {
  //   it('returns opcode array', () => {
  //     testState.solidColor = new ColorRGB(
  //       20,
  //       80,
  //       40,
  //     );
  //     expect(testState.solidColorChange).toStrictEqual(
  //       [
  //         COMMAND_IDENTIFIER, 5, 2, 20, 80,
  //         40, 0, 255, 174, 84,
  //         0, 0, 0, 0, 0,
  //         0, 0, 0, 0, 93,
  //       ],
  //     );
  //   });
  // });
});