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
    it('processes DeviceState.commands', () => {
      expect(testState.colorSegments).toStrictEqual(new Array(15).fill(undefined));
      testState.parse({
        deviceId: 'device',
        commands: [
          [REPORT_IDENTIFIER, 5, 11, 10, 50, 255, 0, 0, 5, 0],
        ],
      });
      expect(testState.colorSegments).toHaveLength(15);
      for (let i = 0; i < testState.colorSegments.length; i++) {
        if ([1, 3].includes(i)) {
          const color = testState.colorSegments[i];
          expect(color).toBeDefined();
          expect(color?.red).toBe(10);
          expect(color?.green).toBe(50);
          expect(color?.blue).toBe(255);
        } else {
          expect(testState.colorSegments[i]).toBeUndefined();
        }
      }
    });

    // it('ignores non-applicable DeviceState', () => {
    //   expect(testState.solidColor).toBeUndefined();
    //   testState.parse({
    //     deviceId: 'device',
    //     brightness: 100,
    //     commands: [
    //       [REPORT_IDENTIFIER, 1, 2],
    //     ],
    //   });
    //   expect(testState.solidColor).toBeUndefined();
    // });
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