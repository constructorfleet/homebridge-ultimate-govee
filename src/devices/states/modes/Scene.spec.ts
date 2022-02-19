import {COMMAND_IDENTIFIER, REPORT_IDENTIFIER} from '../../../util/const';
import {SceneMode} from './Scene';

let testMode: SceneMode;

describe('SceneMode', () => {
  beforeEach(() => {
    testMode = new SceneMode();
  });

  describe('parse', () => {
    it('processes DeviceState.commands', () => {
      expect(testMode.sceneId).toBe(0);
      testMode.parse({
        deviceId: 'device',
        commands: [
          [REPORT_IDENTIFIER, 5, 4, 10],
        ],
      });
      expect(testMode.sceneId).toBe(10);
    });

    it('ignores non-applicable DeviceState', () => {
      expect(testMode.sceneId).toBe(0);
      testMode.parse({
        deviceId: 'device',
        brightness: 100,
        commands: [
          [REPORT_IDENTIFIER, 1, 2],
        ],
      });
      expect(testMode.sceneId).toBe(0);
    });
  });

  describe('sceneChange', () => {
    it('returns opcode array', () => {
      testMode.sceneId = 22;
      expect(testMode.sceneChange()).toStrictEqual(
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