import { DEFAULTS } from './constants.js';

export class SignalManager {
  constructor() {
    this.signals = new Map();
  }

  observe(sourceId, strength) {
    const current = this.signals.get(sourceId) || 0;
    this.signals.set(sourceId, Math.max(current, Math.min(1, strength)));
  }

  getRisk(neighborId) {
    return this.signals.get(neighborId) || 0;
  }

  decay() {
    for (const [sourceId, strength] of this.signals.entries()) {
      const next = strength * DEFAULTS.signalDecay;
      if (next < 0.03) {
        this.signals.delete(sourceId);
      } else {
        this.signals.set(sourceId, next);
      }
    }
  }

  shouldReactTo(sourceId) {
    return this.getRisk(sourceId) >= DEFAULTS.signalReactThreshold;
  }

  snapshot() {
    return Object.fromEntries(
      [...this.signals.entries()].map(([id, strength]) => [id, Number(strength.toFixed(3))])
    );
  }
}
