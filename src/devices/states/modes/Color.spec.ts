import {COMMAND_IDENTIFIER, REPORT_IDENTIFIER} from '../../../util/const';
import {ColorRGB} from '../../../util/colorUtils';
import {ColorMode} from './Color';

let testMode: ColorMode;

describe('SolidColorMode', () => {
  beforeEach(() => {
    testMode = new ColorMode();
  });

  describe('parse', () => {
    it('processes DeviceState.commands', () => {
      expect(testMode.solidColor.red).toBe(0);
      expect(testMode.solidColor.green).toBe(0);
      expect(testMode.solidColor.blue).toBe(0);
      testMode.parse({
        deviceId: 'device',
        commands: [
          [REPORT_IDENTIFIER, 5, 13, 10, 1, 299],
        ],
      });
      expect(testMode.solidColor.red).toBe(10);
      expect(testMode.solidColor.green).toBe(1);
      expect(testMode.solidColor.blue).toBe(299);
    });

    it('ignores non-applicable DeviceState', () => {
      expect(testMode.solidColor.red).toBe(0);
      expect(testMode.solidColor.green).toBe(0);
      expect(testMode.solidColor.blue).toBe(0);
      testMode.parse({
        deviceId: 'device',
        brightness: 100,
        commands: [
          [REPORT_IDENTIFIER, 1, 2],
        ],
      });
      expect(testMode.solidColor.red).toBe(0);
      expect(testMode.solidColor.green).toBe(0);
      expect(testMode.solidColor.blue).toBe(0);
    });
  });

  describe('colorChange', () => {
    it('returns opcode array', () => {
      testMode.solidColor = new ColorRGB(40, 10, 99);
      expect(testMode.colorChange()).toStrictEqual(
        [
          COMMAND_IDENTIFIER, 5, 13, 40, 10,
          99, 0, 0, 0, 0,
          0, 0, 0, 0, 0,
          0, 0, 0, 0, 122,
        ],
      );
    });
  });
});