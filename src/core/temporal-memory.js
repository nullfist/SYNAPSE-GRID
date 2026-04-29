import { DEFAULTS } from './constants.js';

export class TemporalMemory {
  constructor(limit = DEFAULTS.temporalWindow) {
    this.limit = limit;
    this.samples = [];
  }

  record(sample) {
    this.samples.push({ ...sample, timestamp: Date.now() });
    if (this.samples.length > this.limit) {
      this.samples.shift();
    }
  }

  recentSuccessRate() {
    if (this.samples.length === 0) return 0.5;
    const recent = this.samples.slice(Math.floor(this.samples.length / 2));
    return successRate(recent);
  }

  trend() {
    if (this.samples.length < 6) return 0;
    const middle = Math.floor(this.samples.length / 2);
    const older = this.samples.slice(0, middle);
    const newer = this.samples.slice(middle);
    return successRate(newer) - successRate(older);
  }

  averageLatency() {
    const latencies = this.samples
      .map((sample) => sample.latencyMs)
      .filter((latency) => typeof latency === 'number');
    if (latencies.length === 0) return null;
    return latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length;
  }

  anomalyFrequency() {
    if (this.samples.length === 0) return 0;
    const anomalies = this.samples.filter((sample) => sample.anomaly).length;
    return anomalies / this.samples.length;
  }

  snapshot() {
    return {
      samples: this.samples.length,
      recentSuccessRate: Number(this.recentSuccessRate().toFixed(3)),
      trend: Number(this.trend().toFixed(3)),
      averageLatency: this.averageLatency() === null ? null : Number(this.averageLatency().toFixed(1)),
      anomalyFrequency: Number(this.anomalyFrequency().toFixed(3))
    };
  }
}

function successRate(samples) {
  if (samples.length === 0) return 0.5;
  const successes = samples.filter((sample) => sample.success).length;
  return successes / samples.length;
}
