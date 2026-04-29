import { NODE_BEHAVIOR } from './constants.js';

export const BEHAVIOR_PROFILES = Object.freeze({
  [NODE_BEHAVIOR.NORMAL]: {
    label: 'Normal',
    latencyMs: 80,
    anomalyRate: 0,
    dropRate: 0,
    loadMultiplier: 1
  },
  [NODE_BEHAVIOR.SLOW]: {
    label: 'Slow',
    latencyMs: 420,
    anomalyRate: 0,
    dropRate: 0,
    loadMultiplier: 1.35
  },
  [NODE_BEHAVIOR.MALICIOUS]: {
    label: 'Malicious',
    latencyMs: 110,
    anomalyRate: 0.85,
    dropRate: 0.08,
    loadMultiplier: 1.1
  },
  [NODE_BEHAVIOR.UNSTABLE]: {
    label: 'Unstable',
    latencyMs: 180,
    anomalyRate: 0.12,
    dropRate: 0.32,
    loadMultiplier: 1.6
  }
});

export function getBehaviorProfile(behavior) {
  return BEHAVIOR_PROFILES[behavior] || BEHAVIOR_PROFILES[NODE_BEHAVIOR.NORMAL];
}
