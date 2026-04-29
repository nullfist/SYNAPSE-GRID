import { EVENT_TYPES } from './constants.js';

export class AnomalyDetector {
  constructor() {
    this.recentMessages = new Map();
    this.patterns = new Map();
  }

  inspect(message) {
    const now = Date.now();
    const senderId = message.sender_id;
    const reasons = [];
    const recent = (this.recentMessages.get(senderId) || []).filter((time) => now - time < 2500);
    recent.push(now);
    this.recentMessages.set(senderId, recent);

    if (recent.length > 6) {
      reasons.push('abnormal_frequency');
    }

    if (!message.type || !message.payload || !senderId || !Array.isArray(message.path_history)) {
      reasons.push('invalid_structure');
    }

    if (message.type === EVENT_TYPES.DATA_PACKET) {
      if (typeof message.payload.destination !== 'string') {
        reasons.push('invalid_destination');
      }
      if (message.payload.integrity === false) {
        reasons.push('invalid_data');
      }
    }

    const previous = this.patterns.get(senderId);
    const declaredOrigin = message.payload?.origin;
    if (previous && declaredOrigin && previous !== declaredOrigin) {
      reasons.push('inconsistent_origin_pattern');
    }
    if (declaredOrigin) {
      this.patterns.set(senderId, declaredOrigin);
    }

    const score = Math.min(1, reasons.length * 0.34);
    return {
      anomalous: reasons.length > 0,
      score,
      reasons
    };
  }
}
