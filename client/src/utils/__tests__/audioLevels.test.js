import { computeRms, computePeak, dbToLinear } from '../../utils/AudioEnhancer';

test('computeRms returns correct RMS for simple buffer', () => {
  const buf = new Float32Array([0, 1, -1, 0.5, -0.5]);
  const rms = computeRms(buf);
  expect(rms).toBeGreaterThan(0);
  expect(Number(rms.toFixed(4))).toBeCloseTo(0.7746, 3);
});

test('computePeak returns absolute peak', () => {
  const buf = new Float32Array([0.2, -0.9, 0.5]);
  expect(computePeak(buf)).toBeCloseTo(0.9, 4);
});

test('dbToLinear converts dB to linear gain', () => {
  expect(Number(dbToLinear(-6).toFixed(4))).toBeCloseTo(0.5012, 3);
  expect(Number(dbToLinear(-3).toFixed(4))).toBeCloseTo(0.7079, 3);
});

