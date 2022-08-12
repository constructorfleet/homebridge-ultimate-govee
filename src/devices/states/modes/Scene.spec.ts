import {COMMAND_IDENTIFIER, REPORT_IDENTIFIER} from '../../../util/const';
import {SceneMode, SceneModeState} from './Scene';
import {State} from '../State';


class TestMode extends SceneMode(State) {
  constructor(args) {
    super(args);
  }
}

let testMode: SceneModeState & State;

describe('SceneMode', () => {
  beforeEach(() => {
    testMode = new TestMode({
      sceneModeIdentifier: 4,
    });
  });

  describe('parse', () => {
    it('processes DeviceState.mode', () => {
      expect(testMode.activeSceneId).toBeUndefined();
      expect(testMode.activeMode).toBeUndefined();
      testMode.parse({
        deviceId: 'testDevice',
        command: 'status',
        mode: 5,
      });
      expect(testMode.activeMode).toBe(5);
      expect(testMode.activeSceneId).toBeUndefined();
    });
    it('processes DeviceState.commands', () => {
      expect(testMode.activeSceneId).toBeUndefined();
      expect(testMode.activeMode).toBeUndefined();
      testMode.parse({
        deviceId: 'device',
        commands: [
          [REPORT_IDENTIFIER, 5, 4, 10],
        ],
      });
      expect(testMode.activeMode).toBe(4);
      expect(testMode.activeSceneId).toBe(10);
    });

    it('ignores non-applicable DeviceState', () => {
      expect(testMode.activeSceneId).toBeUndefined();
      expect(testMode.activeMode).toBeUndefined();
      testMode.parse({
        deviceId: 'device',
        brightness: 100,
        commands: [
          [REPORT_IDENTIFIER, 1, 2],
        ],
      });
      expect(testMode.activeSceneId).toBeUndefined();
      expect(testMode.activeMode).toBeUndefined();
    });
  });

  describe('sceneChange', () => {
    it('returns opcode array', () => {
      testMode.activeMode = testMode.sceneModeIdentifier;
      testMode.activeSceneId = 22;
      expect(testMode.sceneIdChange()).toStrictEqual(
          [
            COMMAND_IDENTIFIER, 5, 4, 22, 0,
            0, 0, 0, 0, 0,
            0, 0, 0, 0, 0,
            0, 0, 0, 0, 36,
          ],
      );
    });
  });
});
