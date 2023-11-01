import { State } from './State';
import { REPORT_IDENTIFIER } from '../../util/const';
import { ProgrammableFanSpeed, ProgrammableFanSpeedState } from './ProgrammableFanSpeed';
import { SimpleFanSpeed, SimpleFanSpeedState } from './SimpleFanSpeed';

class TestState extends ProgrammableFanSpeed(SimpleFanSpeed(State)) {
  constructor(...args) {
    super(...args);
  }
}

let testState: ProgrammableFanSpeedState & SimpleFanSpeedState & State;

describe('ProgrammableFanSpeedState', () => {
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
      expect(testState.simpleFanSpeed).toBeUndefined();
      expect(testState.fanProgramId).toBeUndefined();
      expect(testState.fanPrograms.size).toBe(0);
      testState.parse({
        deviceId: 'device',
        commands: [
          [REPORT_IDENTIFIER, 5, 0, 2],
          [REPORT_IDENTIFIER, 5, 2, 0, 3, 0, 10,
            0, 10, 2, 0, 10, 0, 10,
            1, 255, 255, 255, 255, 173],
        ],
      });
      expect(testState.simpleFanSpeed).toBe(3);
      expect(testState.fanProgramId).toBe(0);
      expect(testState.fanPrograms.size).toBe(3);

      let fanProgram = testState.fanPrograms.get(0);
      expect(fanProgram?.fanSpeed).toBe(3);
      expect(fanProgram?.duration).toBe(10);
      expect(fanProgram?.remaining).toBe(10);
      fanProgram = testState.fanPrograms.get(1);
      expect(fanProgram?.fanSpeed).toBe(2);
      expect(fanProgram?.duration).toBe(10);
      expect(fanProgram?.remaining).toBe(10);
      fanProgram = testState.fanPrograms.get(2);
      expect(fanProgram?.fanSpeed).toBe(1);
      expect(fanProgram?.duration).toBe(65280);
      expect(fanProgram?.remaining).toBe(65280);
    });

    it('ignores non-applicable DeviceState', () => {
      expect(testState.simpleFanSpeed).toBeUndefined();
      expect(testState.fanProgramId).toBeUndefined();
      expect(testState.fanPrograms.size).toBe(0);
      testState.parse({
        deviceId: 'device',
        brightness: 100,
        commands: [
          [REPORT_IDENTIFIER, 1, 2],
        ],
      });
      expect(testState.simpleFanSpeed).toBeUndefined();
      expect(testState.fanProgramId).toBeUndefined();
      expect(testState.fanPrograms.size).toBe(0);
    });
  });
});