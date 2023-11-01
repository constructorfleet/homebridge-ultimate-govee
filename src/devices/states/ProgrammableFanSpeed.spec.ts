import {State} from './State';
import {REPORT_IDENTIFIER} from '../../util/const';
import {ProgrammableFanSpeed, ProgrammableFanSpeedState} from './ProgrammableFanSpeed';
import {FanSpeed, FanSpeedState} from './FanSpeed';

class TestState extends ProgrammableFanSpeed(FanSpeed(State)) {
  constructor(...args) {
    super(...args);
  }
}

let testState: ProgrammableFanSpeedStateState & FanSpeedState & State;

describe('ProgrammableMistLevelState', () => {
  beforeEach(() => {
    testState = new TestState();
  });

  describe('constructor', () => {
    it('adds command identifier', () => {
      expect(testState.deviceStatusCodes.size).toBe(2);

      expect(Array.from(testState.deviceStatusCodes)).toStrictEqual([[5, 1], [5, 2]]);
    });
  });

  describe('parse', () => {
    it('processes DeviceState.commands', () => {
      expect(testState.mistLevel).toBeUndefined();
      expect(testState.mistProgramId).toBeUndefined();
      expect(testState.mistPrograms.size).toBe(0);
      testState.parse({
        deviceId: 'device',
        commands: [
          [REPORT_IDENTIFIER, 5, 1, 2],
          [REPORT_IDENTIFIER, 5, 2, 16, 5, 0, 100, 0, 50, 8, 0, 10, 0, 10, 1, 0xff, 0xff, 0xff, 0xff],
        ],
      });
      expect(testState.mistLevel).toBe(2);
      expect(testState.mistProgramId).toBe(1);
      expect(testState.mistPrograms.size).toBe(3);

      let mistProgram = testState.mistPrograms.get(0);
      expect(mistProgram?.mistLevel).toBe(5);
      expect(mistProgram?.duration).toBe(100);
      expect(mistProgram?.remaining).toBe(50);
      mistProgram = testState.mistPrograms.get(1);
      expect(mistProgram?.mistLevel).toBe(8);
      expect(mistProgram?.duration).toBe(10);
      expect(mistProgram?.remaining).toBe(10);
      mistProgram = testState.mistPrograms.get(2);
      expect(mistProgram?.mistLevel).toBe(1);
      expect(mistProgram?.duration).toBe(65280);
      expect(mistProgram?.remaining).toBe(65280);
    });

    it('ignores non-applicable DeviceState', () => {
      expect(testState.mistLevel).toBeUndefined();
      expect(testState.mistProgramId).toBeUndefined();
      expect(testState.mistPrograms.size).toBe(0);
      testState.parse({
        deviceId: 'device',
        brightness: 100,
        commands: [
          [REPORT_IDENTIFIER, 1, 2],
        ],
      });
      expect(testState.mistLevel).toBeUndefined();
      expect(testState.mistProgramId).toBeUndefined();
      expect(testState.mistPrograms.size).toBe(0);
    });
  });
});