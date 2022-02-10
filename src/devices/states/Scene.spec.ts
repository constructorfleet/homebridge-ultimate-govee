import {State} from './State';
import {COMMAND_IDENTIFIER, REPORT_IDENTIFIER} from '../../util/const';
import {Scene, SceneState} from './Scenes';

class TestState extends Scene(State) {
  constructor(...args) {
    super(...args);
  }
}

let testState: SceneState & State;

describe('SceneState', () => {
  beforeEach(() => {
    testState = new TestState();
  });

  describe('constructor', () => {
    it('adds command identifier', () => {
      expect(testState.deviceStatusCodes).toHaveLength(1);
      expect(testState.deviceStatusCodes).toStrictEqual([[5, 4]]);
    });
  });

  describe('parse', () => {
    it('processes DeviceState.commands', () => {
      expect(testState.sceneId).toBeUndefined();
      testState.parse({
        deviceId: 'device',
        commands: [
          [REPORT_IDENTIFIER, 5, 4, 10],
        ],
      });
      expect(testState.sceneId).toBe(10);
      testState.parse({
        deviceId: 'device',
        commands: [
          [REPORT_IDENTIFIER, 5, 4, 1],
        ],
      });
      expect(testState.sceneId).toBe(1);
    });

    it('ignores non-applicable DeviceState', () => {
      expect(testState.sceneId).toBeUndefined();
      testState.parse({
        deviceId: 'device',
        brightness: 100,
        commands: [
          [REPORT_IDENTIFIER, 1, 2],
        ],
      });
      expect(testState.sceneId).toBeUndefined();
    });
  });

  describe('sceneChange', () => {
    it('returns opcode array', () => {
      testState.sceneId = 50;
      expect(testState.sceneChange).toStrictEqual(
        [
          COMMAND_IDENTIFIER, 5, 4, 50, 0,
          0, 0, 0, 0, 0,
          0, 0, 0, 0, 0,
          0, 0, 0, 0, 0,
        ],
      );
    });
  });
});