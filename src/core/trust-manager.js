import { DEFAULTS, TRUST_WEIGHTS } from './constants.js';
import { TemporalMemory } from './temporal-memory.js';

function clamp(value) {
  return Math.max(DEFAULTS.minTrust, Math.min(DEFAULTS.maxTrust, value));
}

export class TrustManager {
  constructor(nodeId, neighborIds = []) {
    this.nodeId = nodeId;
    this.trust = new Map();
    this.history = new Map();
    for (const id of neighborIds) {
      this.addNeighbor(id);
    }
  }

  addNeighbor(neighborId) {
    if (!this.trust.has(neighborId)) {
      this.trust.set(neighborId, DEFAULTS.initialTrust);
      this.history.set(neighborId, {
        successes: 0,
        failures: 0,
        anomalies: 0,
        signalInfluence: 0,
        loadSamples: [],
        temporal: new TemporalMemory(),
        lastInteraction: null
      });
    }
  }

  getTrust(neighborId) {
    this.addNeighbor(neighborId);
    const stats = this.history.get(neighborId);
    const total = stats.successes + stats.failures + stats.anomalies;
    if (total === 0 && stats.signalInfluence === 0) {
      return this.trust.get(neighborId) ?? DEFAULTS.initialTrust;
    }

    const reliability = this.getReliability(neighborId);
    const latency = this.getLatencyScore(neighborId);
    const anomaly = this.getAnomalyScore(neighborId);
    const signal = this.getSignalScore(neighborId);
    const trendBoost = stats.temporal.trend() * 0.08;
    const weighted =
      reliability * TRUST_WEIGHTS.reliability +
      latency * TRUST_WEIGHTS.latency +
      anomaly * TRUST_WEIGHTS.anomaly +
      signal * TRUST_WEIGHTS.signal +
      trendBoost;
    const memory = this.trust.get(neighborId) ?? DEFAULTS.initialTrust;
    return clamp(weighted * 0.78 + memory * 0.22);
  }

  getSuccessRate(neighborId) {
    const stats = this.history.get(neighborId);
    if (!stats) return 0.5;
    const total = stats.successes + stats.failures + stats.anomalies;
    if (total === 0) return 0.5;
    return stats.successes / total;
  }

  getReliability(neighborId) {
    const stats = this.getStats(neighborId);
    const total = stats.successes + stats.failures + stats.anomalies;
    if (total === 0) return DEFAULTS.initialTrust;
    return stats.successes / total;
  }

  getLatencyScore(neighborId) {
    const averageLatency = this.getStats(neighborId).temporal?.averageLatency();
    if (averageLatency === null || averageLatency === undefined) return 0.72;
    return clamp(1 - averageLatency / DEFAULTS.latencyBudgetMs);
  }

  getAnomalyScore(neighborId) {
    const frequency = this.getStats(neighborId).temporal?.anomalyFrequency() ?? 0;
    return clamp(1 - frequency);
  }

  getSignalScore(neighborId) {
    const influence = this.getStats(neighborId).signalInfluence || 0;
    return clamp(1 - influence);
  }

  getLoadScore(neighborId) {
    const samples = this.getStats(neighborId).loadSamples || [];
    if (samples.length === 0) return 1;
    const averageLoad = samples.reduce((sum, value) => sum + value, 0) / samples.length;
    return clamp(1 - averageLoad / DEFAULTS.overloadThreshold);
  }

  getTrendScore(neighborId) {
    const trend = this.getStats(neighborId).temporal?.trend() ?? 0;
    return clamp(0.5 + trend / 2);
  }

  getStats(neighborId) {
    return this.history.get(neighborId) || {
      successes: 0,
      failures: 0,
      anomalies: 0,
      signalInfluence: 0,
      loadSamples: [],
      temporal: new TemporalMemory(),
      lastInteraction: null
    };
  }

  reward(neighborId, amount = DEFAULTS.trustIncrease, context = {}) {
    this.addNeighbor(neighborId);
    this.trust.set(neighborId, clamp((this.trust.get(neighborId) ?? DEFAULTS.initialTrust) + amount));
    const stats = this.history.get(neighborId);
    stats.successes += 1;
    stats.temporal.record({
      success: true,
      anomaly: false,
      latencyMs: context.latencyMs,
      load: context.load
    });
    this.recordLoad(neighborId, context.load);
    stats.lastInteraction = Date.now();
    return this.getTrust(neighborId);
  }

  penalize(neighborId, amount = DEFAULTS.trustDecrease, reason = 'failure', context = {}) {
    this.addNeighbor(neighborId);
    this.trust.set(neighborId, clamp((this.trust.get(neighborId) ?? DEFAULTS.initialTrust) - amount));
    const stats = this.history.get(neighborId);
    if (reason === 'anomaly') {
      stats.anomalies += 1;
    } else {
      stats.failures += 1;
    }
    stats.temporal.record({
      success: false,
      anomaly: reason === 'anomaly',
      latencyMs: context.latencyMs,
      load: context.load
    });
    this.recordLoad(neighborId, context.load);
    stats.lastInteraction = Date.now();
    return this.getTrust(neighborId);
  }

  recordSignal(neighborId, strength) {
    this.addNeighbor(neighborId);
    const stats = this.history.get(neighborId);
    stats.signalInfluence = clamp(Math.max(stats.signalInfluence * 0.82, strength));
  }

  recordLoad(neighborId, load) {
    if (typeof load !== 'number') return;
    this.addNeighbor(neighborId);
    const stats = this.history.get(neighborId);
    stats.loadSamples.push(load);
    stats.loadSamples = stats.loadSamples.slice(-DEFAULTS.temporalWindow);
  }

  decay() {
    for (const [neighborId, value] of this.trust.entries()) {
      const direction = value >= DEFAULTS.initialTrust ? -1 : 1;
      const distance = Math.abs(value - DEFAULTS.initialTrust);
      const change = Math.min(distance, DEFAULTS.trustDecay);
      this.trust.set(neighborId, clamp(value + direction * change));
      const stats = this.history.get(neighborId);
      if (stats) {
        stats.signalInfluence *= 0.85;
      }
    }
  }

  recover(neighborId) {
    this.addNeighbor(neighborId);
    const value = this.getTrust(neighborId);
    if (value < DEFAULTS.initialTrust) {
      this.trust.set(neighborId, clamp(value + DEFAULTS.recoveryRate));
    }
    return this.getTrust(neighborId);
  }

  snapshot() {
    return Object.fromEntries(
      [...this.trust.keys()].map((id) => [
        id,
        {
          trust: Number(this.getTrust(id).toFixed(3)),
          successRate: Number(this.getSuccessRate(id).toFixed(3)),
          reliability: Number(this.getReliability(id).toFixed(3)),
          latencyScore: Number(this.getLatencyScore(id).toFixed(3)),
          anomalyScore: Number(this.getAnomalyScore(id).toFixed(3)),
          signalScore: Number(this.getSignalScore(id).toFixed(3)),
          loadScore: Number(this.getLoadScore(id).toFixed(3)),
          trendScore: Number(this.getTrendScore(id).toFixed(3)),
          history: {
            successes: this.getStats(id).successes,
            failures: this.getStats(id).failures,
            anomalies: this.getStats(id).anomalies,
            signalInfluence: Number(this.getStats(id).signalInfluence.toFixed(3)),
            temporal: this.getStats(id).temporal.snapshot(),
            lastInteraction: this.getStats(id).lastInteraction
          }
        }
      ])
    );
  }
}
