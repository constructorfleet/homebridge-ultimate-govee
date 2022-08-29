import {REPORT_IDENTIFIER} from '../../../util/const';
import {State} from '../State';
import {ColorSegment, ColorSegmentsMode, ColorSegmentsModeState} from './ColorSegments';
import {ColorRGB} from '../../../util/colorUtils';


type AssertChain<ArgumentType> = (actual: ArgumentType, expected: ArgumentType) => AssertChain<ArgumentType>;

class TestMode extends ColorSegmentsMode(false, State) {
  constructor() {
    super({
      colorSegmentsModeIdentifier: 21,
      deviceConfig: {
        name: 'TestDevice',
        deviceId: 'device',
        model: 'H1234',
        pactType: 1,
        pactCode: 2,
        goodsType: 21,
      },
    });
  }
}

let testMode: ColorSegmentsModeState & State;

const assertNumber: AssertChain<number | undefined> = (
  actual?: number,
  expected?: number,
): AssertChain<number | undefined> => {
  if (expected === undefined) {
    expect(actual).toBeUndefined();
  } else {
    expect(actual).toBe(expected);
  }
  return assertNumber;
};

const assertColorSegment = (
  expected: ColorSegment,
  segmentIndex: number,
) => {
  assertNumber(
    testMode.colorSegments[segmentIndex].color?.red,
    expected.color.red,
  );
  assertNumber(
    testMode.colorSegments[segmentIndex].color?.green,
    expected.color.green,
  );
  assertNumber(
    testMode.colorSegments[segmentIndex].color?.blue,
    expected.color.blue,
  );
  assertNumber(
    testMode.colorSegments[segmentIndex].brightness,
    expected.brightness,
  );
};

const assertColorSegments = (
  ...colorSegments: ColorSegment[]
) => {
  colorSegments.concat(
    ...Array.from(
      new Array(testMode.colorSegments.length - colorSegments.length)
        .fill(new ColorSegment(
          new ColorRGB(0, 0, 0),
          0,
        )),
    ),
  ).forEach(assertColorSegment);
};

describe('ColorSegmentsMode', () => {
  beforeEach(() => {
    testMode = new TestMode();
  });

  describe('parse', () => {
    it('processes DeviceState.mode', () => {
      expect(testMode.colorSegments).toHaveLength(0);
      expect(testMode.activeMode).toBeUndefined();
      testMode.parse({
        deviceId: 'testDevice',
        command: 'status',
        mode: 10,
      });
      expect(testMode.colorSegments).toHaveLength(0);
      expect(testMode.activeMode).toBe(10);
    });
    it('processes DeviceState.commands 1 segment', () => {
      expect(testMode.colorSegments).toHaveLength(0);
      testMode.parse({
        deviceId: 'device',
        commands: [
          [REPORT_IDENTIFIER, 17, 0, 15, 15, 0, 0, 0 , 0, 0, 0, 0, 0, 0],
          [REPORT_IDENTIFIER, 165, 1, 75, 50, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ],
      });
      expect(testMode.colorSegments).toHaveLength(15);
      assertColorSegments(
        new ColorSegment(
          new ColorRGB(50, 255, 0),
          75,
        ),
      );
    });

    it('processes DeviceState.commands 2 segment', () => {
      expect(testMode.colorSegments).toHaveLength(0);
      testMode.parse({
        deviceId: 'device',
        commands: [
          [REPORT_IDENTIFIER, 17, 0, 15, 15, 0, 0, 0 , 0, 0, 0, 0, 0, 0],
          [REPORT_IDENTIFIER, 165, 1, 75, 50, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [REPORT_IDENTIFIER, 165, 2, 0, 0, 0, 0, 75, 50, 255, 0, 0, 0, 0, 0],
        ],
      });
      expect(testMode.colorSegments).toHaveLength(15);
      // expect(testMode.colorSegments).toBeUndefined();
      assertColorSegments(
        new ColorSegment(
          new ColorRGB(50, 255, 0),
          75,
        ),
        new ColorSegment(
          new ColorRGB(0, 0, 0),
          0,
        ),
        new ColorSegment(
          new ColorRGB(0, 0, 0),
          0,
        ),
        new ColorSegment(
          new ColorRGB(0, 0, 0),
          0,
        ),
        new ColorSegment(
          new ColorRGB(50, 255, 0),
          75,
        ),
      );
    });

    it('ignores non-applicable DeviceState', () => {
      expect(testMode.colorSegments).toHaveLength(0);
      testMode.parse({
        deviceId: 'device',
        brightness: 100,
        commands: [
          [REPORT_IDENTIFIER, 1, 2],
        ],
      });
      expect(testMode.colorSegments).toHaveLength(0);
    });
  });
});