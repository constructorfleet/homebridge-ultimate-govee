import {REPORT_IDENTIFIER} from '../../../util/const';
import {ColorSegmentsMode} from './ColorSegments';

let testMode: ColorSegmentsMode;

describe('ColorSegmentsMode', () => {
  beforeEach(() => {
    testMode = new ColorSegmentsMode();
  });

  describe('parse', () => {
    it('processes DeviceState.commands 1 segment', () => {
      expect(testMode.colorSegments).toHaveLength(15);
      testMode.colorSegments.forEach(
        (segment) => {
          expect(segment.color.red).toBe(0);
          expect(segment.color.green).toBe(0);
          expect(segment.color.blue).toBe(0);
          expect(segment.brightness).toBe(0);
        },
      );
      testMode.parse({
        deviceId: 'device',
        commands: [
          [REPORT_IDENTIFIER, 165, 1, 75, 50, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ],
      });
      expect(testMode.colorSegments).toHaveLength(15);
      for (let i = 0; i < testMode.colorSegments.length; i++) {
        const segment = testMode.colorSegments[i];
        if ([0].includes(i)) {
          expect(segment.color.red).toBe(50);
          expect(segment.color.green).toBe(255);
          expect(segment.color.blue).toBe(0);
          expect(segment.brightness).toBe(75);
        } else {
          expect(segment.color.red).toBe(0);
          expect(segment.color.green).toBe(0);
          expect(segment.color.blue).toBe(0);
          expect(segment.brightness).toBe(0);
        }
      }
    });

    it('processes DeviceState.commands 2 segment', () => {
      expect(testMode.colorSegments).toHaveLength(15);
      testMode.colorSegments.forEach(
        (segment) => {
          expect(segment.color.red).toBe(0);
          expect(segment.color.green).toBe(0);
          expect(segment.color.blue).toBe(0);
          expect(segment.brightness).toBe(0);
        },
      );
      testMode.parse({
        deviceId: 'device',
        commands: [
          [REPORT_IDENTIFIER, 165, 1, 75, 50, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [REPORT_IDENTIFIER, 165, 2, 0, 0, 0, 0, 75, 50, 255, 0, 0, 0, 0, 0],
        ],
      });
      expect(testMode.colorSegments).toHaveLength(15);
      for (let i = 0; i < testMode.colorSegments.length; i++) {
        const segment = testMode.colorSegments[i];
        if ([0, 4].includes(i)) {
          expect(segment.color.red).toBe(50);
          expect(segment.color.green).toBe(255);
          expect(segment.color.blue).toBe(0);
          expect(segment.brightness).toBe(75);
        } else {
          expect(segment.color.red).toBe(0);
          expect(segment.color.green).toBe(0);
          expect(segment.color.blue).toBe(0);
          expect(segment.brightness).toBe(0);
        }
      }
    });

    it('ignores non-applicable DeviceState', () => {
      expect(testMode.colorSegments).toHaveLength(15);
      testMode.colorSegments.forEach(
        (segment) => {
          expect(segment.color.red).toBe(0);
          expect(segment.color.green).toBe(0);
          expect(segment.color.blue).toBe(0);
          expect(segment.brightness).toBe(0);
        },
      );
      testMode.parse({
        deviceId: 'device',
        brightness: 100,
        commands: [
          [REPORT_IDENTIFIER, 1, 2],
        ],
      });
      expect(testMode.colorSegments).toHaveLength(15);
      testMode.colorSegments.forEach(
        (segment) => {
          expect(segment.color.red).toBe(0);
          expect(segment.color.green).toBe(0);
          expect(segment.color.blue).toBe(0);
          expect(segment.brightness).toBe(0);
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