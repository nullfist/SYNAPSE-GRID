export const EVENT_TYPES = Object.freeze({
  DATA_PACKET: 'DATA_PACKET',
  ANOMALY_SIGNAL: 'ANOMALY_SIGNAL',
  NODE_FAILURE: 'NODE_FAILURE',
  TRUST_UPDATE: 'TRUST_UPDATE'
});

export const NODE_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  FAILED: 'FAILED',
  MALICIOUS: 'MALICIOUS'
});

export const NODE_BEHAVIOR = Object.freeze({
  NORMAL: 'normal',
  SLOW: 'slow',
  MALICIOUS: 'malicious',
  UNSTABLE: 'unstable'
});

export const DEFAULTS = Object.freeze({
  initialTrust: 0.62,
  minTrust: 0,
  maxTrust: 1,
  trustIncrease: 0.06,
  trustDecrease: 0.18,
  trustDecay: 0.006,
  recoveryRate: 0.018,
  anomalyThreshold: 0.68,
  signalDecay: 0.72,
  signalReactThreshold: 0.32,
  explorationRate: 0.18,
  maxPathLength: 9,
  latencyBudgetMs: 700,
  overloadThreshold: 7,
  temporalWindow: 18
});

export const TRUST_WEIGHTS = Object.freeze({
  reliability: 0.38,
  latency: 0.2,
  anomaly: 0.24,
  signal: 0.18
});
