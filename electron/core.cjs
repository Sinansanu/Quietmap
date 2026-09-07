function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function normalizeRelativeNoise(rms) {
  if (!Number.isFinite(rms) || rms <= 0) return 0;
  const dbfs = 20 * Math.log10(rms);
  return Math.round(clamp(((dbfs + 60) / 60) * 100, 0, 100));
}

function calculateFocusScore({ averageNoise, stability, interruptions, durationMinutes }) {
  const quietness = clamp(100 - averageNoise, 0, 100);
  const interruptionScore = clamp(100 - interruptions * 12, 0, 100);
  const durationScore = clamp((durationMinutes / 45) * 100, 0, 100);
  // The score describes the observed environment, not the person using it.
  return Math.round(quietness * 0.4 + stability * 0.3 + interruptionScore * 0.24 + durationScore * 0.06);
}

function calculateStability(levels) {
  if (levels.length < 2) return 100;
  const average = levels.reduce((sum, level) => sum + level, 0) / levels.length;
  const variance = levels.reduce((sum, level) => sum + (level - average) ** 2, 0) / levels.length;
  return Math.round(clamp(100 - Math.sqrt(variance) * 4, 0, 100));
}

function shouldStartInterruption({ level, baseline, threshold }) {
  return level - baseline >= threshold;
}

function findQuietestHour(samples) {
  if (!samples.length) return null;
  const byHour = new Map();
  for (const sample of samples) {
    const hour = new Date(sample.timestamp).getHours();
    const bucket = byHour.get(hour) || { total: 0, count: 0 };
    bucket.total += sample.noiseLevel;
    bucket.count += 1;
    byHour.set(hour, bucket);
  }
  let quietest = null;
  for (const [hour, bucket] of byHour) {
    const average = bucket.total / bucket.count;
    if (!quietest || average < quietest.average) quietest = { hour, average, count: bucket.count };
  }
  return quietest;
}

module.exports = {
  clamp,
  normalizeRelativeNoise,
  calculateFocusScore,
  calculateStability,
  shouldStartInterruption,
  findQuietestHour,
};
