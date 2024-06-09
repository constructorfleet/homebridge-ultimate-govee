export type MeasurementData = {
  range?: {
    min: number;
    max: number;
  };
  calibration?: number;
  raw?: number;
  current?: number;
  unit?: string;
};
