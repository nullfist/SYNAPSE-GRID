import { DEFAULTS, EVENT_TYPES, NODE_BEHAVIOR, NODE_STATUS } from './constants.js';
import { createMessage } from './message.js';
import { TrustManager } from './trust-manager.js';
import { SignalManager } from './signal-manager.js';
import { AnomalyDetector } from './anomaly-detector.js';
import { Router } from './router.js';
import { getBehaviorProfile } from './behavior-profiles.js';

export class NodeAgent {
  constructor({ id, neighbors = [], eventBus, behavior = NODE_BEHAVIOR.NORMAL, random = Math.random }) {
    this.id = id;
    this.neighborIds = new Set(neighbors);
    this.status = NODE_STATUS.ACTIVE;
    this.behavior = behavior;
    this.profile = getBehaviorProfile(behavior);
    this.eventBus = eventBus;
    this.trustManager = new TrustManager(id, neighbors);
    this.signalManager = new SignalManager();
    this.anomalyDetector = new AnomalyDetector();
    this.router = new Router(random);
    this.random = random;
    this.receivedPackets = 0;
    this.forwardedPackets = 0;
    this.droppedPackets = 0;
    this.successfulPackets = 0;
    this.totalLatencyMs = 0;
    this.currentLoad = 0;
    this.trustEvolution = [];
  }

  setNeighbors(neighborIds) {
    this.neighborIds = new Set(neighborIds);
    for (const id of neighborIds) {
      this.trustManager.addNeighbor(id);
    }
  }

  fail() {
    this.status = NODE_STATUS.FAILED;
  }

  recover() {
    this.status = NODE_STATUS.ACTIVE;
  }

  toggleMalicious() {
    const isMalicious = this.behavior === NODE_BEHAVIOR.MALICIOUS || this.status === NODE_STATUS.MALICIOUS;
    this.behavior = isMalicious ? NODE_BEHAVIOR.NORMAL : NODE_BEHAVIOR.MALICIOUS;
    this.profile = getBehaviorProfile(this.behavior);
    this.status = isMalicious ? NODE_STATUS.ACTIVE : NODE_STATUS.MALICIOUS;
  }

  setBehavior(behavior) {
    this.behavior = behavior;
    this.profile = getBehaviorProfile(behavior);
    this.status = behavior === NODE_BEHAVIOR.MALICIOUS ? NODE_STATUS.MALICIOUS : NODE_STATUS.ACTIVE;
  }

  tick() {
    this.trustManager.decay();
    this.signalManager.decay();
    this.currentLoad = Math.max(0, this.currentLoad - 1.4);
    for (const neighborId of this.neighborIds) {
      this.trustManager.recover(neighborId);
    }
    this.trustEvolution.push({
      timestamp: Date.now(),
      averageTrust: this.averageTrust(),
      reliability: this.reliability()
    });
    this.trustEvolution = this.trustEvolution.slice(-80);
  }

  receive(message, network) {
    if (this.status === NODE_STATUS.FAILED) {
      return { delivered: false, reason: 'node_failed' };
    }

    const inspection = this.anomalyDetector.inspect(message);
    if (inspection.anomalous) {
      this.trustManager.penalize(message.sender_id, DEFAULTS.trustDecrease * inspection.score, 'anomaly');
      this.broadcastAnomaly(message.sender_id, inspection, network, message.path_history);
    } else if (message.sender_id !== this.id) {
      this.trustManager.reward(message.sender_id, DEFAULTS.trustIncrease / 2);
    }

    if (message.type === EVENT_TYPES.ANOMALY_SIGNAL) {
      this.handleSignal(message, network);
      return { delivered: true, reason: 'signal_processed' };
    }

    if (message.type === EVENT_TYPES.NODE_FAILURE) {
      this.trustManager.penalize(message.payload.failedNodeId, DEFAULTS.trustDecrease / 2, 'failure');
      this.signalManager.observe(message.payload.failedNodeId, message.trust_weight);
      return { delivered: true, reason: 'failure_processed' };
    }

    if (message.type === EVENT_TYPES.DATA_PACKET) {
      return this.routeData(message, network);
    }

    return { delivered: false, reason: 'unknown_message_type' };
  }

  routeData(message, network) {
    this.receivedPackets += 1;
    this.currentLoad += this.profile.loadMultiplier;
    const currentPath = message.path_history.at(-1) === this.id ? [...message.path_history] : [...message.path_history, this.id];

    if (message.payload.destination === this.id) {
      this.successfulPackets += 1;
      return {
        delivered: true,
        reason: 'destination_reached',
        nodeId: this.id,
        latencyMs: this.profile.latencyMs,
        path: currentPath
      };
    }

    if (currentPath.length >= DEFAULTS.maxPathLength) {
      this.droppedPackets += 1;
      return { delivered: false, reason: 'max_path_exceeded', path: currentPath };
    }

    const neighbors = network.getNeighbors(this.id);
    const attempted = new Set();
    let lastResult = null;

    while (attempted.size < neighbors.length) {
      const nextHop = this.router.chooseNextHop({
        currentNode: this,
        destinationId: message.payload.destination,
        neighbors,
        trustManager: this.trustManager,
        signalManager: this.signalManager,
        pathHistory: currentPath,
        excludedIds: [...attempted]
      });

      if (!nextHop) {
        break;
      }

      attempted.add(nextHop.id);
      this.forwardedPackets += 1;
      const outgoing = {
        ...message,
        sender_id: this.id,
        trust_weight: this.trustManager.getTrust(nextHop.id),
        path_history: currentPath,
        timestamp: Date.now()
      };

      network.logDecision({
        nodeId: this.id,
        chosen: nextHop.id,
        destination: message.payload.destination,
        mode: nextHop.decisionMode,
        explanation: nextHop.explanation,
        candidates: nextHop.candidates,
        risk: Number(nextHop.risk.toFixed(3)),
        trust: Number(nextHop.trust.toFixed(3)),
        score: nextHop.score,
        retryAttempt: attempted.size,
        timestamp: Date.now()
      });

      const result = network.deliver(this.id, nextHop.id, outgoing);
      lastResult = { ...result, nextHop: nextHop.id, decision: nextHop };
      if (result.delivered) {
        this.successfulPackets += 1;
        this.totalLatencyMs += result.latencyMs || 0;
        this.trustManager.reward(nextHop.id, DEFAULTS.trustIncrease, {
          latencyMs: result.latencyMs,
          load: result.load
        });
        return {
          ...lastResult,
          path: result.path || [...currentPath, nextHop.id]
        };
      }

      this.trustManager.penalize(nextHop.id, DEFAULTS.trustDecrease / 1.5, 'failure', {
        latencyMs: result.latencyMs,
        load: result.load
      });
      network.logDecision({
        kind: 'reroute',
        nodeId: this.id,
        avoided: nextHop.id,
        reason: result.reason,
        remainingCandidates: Math.max(0, neighbors.length - attempted.size),
        timestamp: Date.now()
      });
    }

    this.droppedPackets += 1;
    return lastResult
      ? { ...lastResult, delivered: false, reason: lastResult.reason || 'no_available_route', path: currentPath }
      : { delivered: false, reason: 'no_available_route', path: currentPath };
  }

  createDataPacket(destination, content) {
    const malicious = this.behavior === NODE_BEHAVIOR.MALICIOUS || this.status === NODE_STATUS.MALICIOUS;
    const integrity = malicious ? this.random() > this.profile.anomalyRate : true;
    const origin = malicious ? `${this.id}-spoof-${Date.now() % 3}` : this.id;
    return createMessage({
      type: EVENT_TYPES.DATA_PACKET,
      senderId: this.id,
      trustWeight: 1,
      pathHistory: [this.id],
      payload: {
        origin,
        destination,
        content,
        integrity
      }
    });
  }

  createFailureNotice(failedNodeId) {
    return createMessage({
      type: EVENT_TYPES.NODE_FAILURE,
      senderId: this.id,
      trustWeight: 0.78,
      pathHistory: [this.id],
      payload: { failedNodeId }
    });
  }

  broadcastAnomaly(sourceId, inspection, network, existingPath = []) {
    const signal = createMessage({
      type: EVENT_TYPES.ANOMALY_SIGNAL,
      senderId: this.id,
      trustWeight: Math.max(0.35, inspection.score),
      pathHistory: [...new Set([...existingPath, this.id])],
      payload: {
        sourceId,
        strength: Math.max(0.35, inspection.score),
        reasons: inspection.reasons
      }
    });
    network.broadcast(this.id, signal);
  }

  handleSignal(message, network) {
    const sourceId = message.payload.sourceId;
    const strength = message.payload.strength * DEFAULTS.signalDecay;
    this.signalManager.observe(sourceId, strength);
    this.trustManager.recordSignal(sourceId, strength);

    if (this.signalManager.shouldReactTo(sourceId)) {
      this.trustManager.penalize(sourceId, DEFAULTS.trustDecrease / 2, 'anomaly');
    }

    if (strength > 0.12 && message.path_history.length < DEFAULTS.maxPathLength) {
      network.broadcast(this.id, {
        ...message,
        sender_id: this.id,
        trust_weight: strength,
        path_history: [...message.path_history, this.id],
        payload: {
          ...message.payload,
          strength
        },
        timestamp: Date.now()
      });
    }
  }

  averageTrust() {
    const trusts = [...this.neighborIds].map((id) => this.trustManager.getTrust(id));
    if (trusts.length === 0) return DEFAULTS.initialTrust;
    return trusts.reduce((sum, value) => sum + value, 0) / trusts.length;
  }

  reliability() {
    if (this.receivedPackets === 0) return 1;
    return this.successfulPackets / this.receivedPackets;
  }

  averageLatency() {
    if (this.successfulPackets === 0) return this.profile.latencyMs;
    return this.totalLatencyMs / this.successfulPackets;
  }

  snapshot() {
    return {
      id: this.id,
      status: this.status,
      behavior: this.behavior,
      profile: this.profile,
      neighbors: [...this.neighborIds],
      trust: this.trustManager.snapshot(),
      signals: this.signalManager.snapshot(),
      metrics: {
        receivedPackets: this.receivedPackets,
        forwardedPackets: this.forwardedPackets,
        droppedPackets: this.droppedPackets,
        successfulPackets: this.successfulPackets,
        reliability: Number(this.reliability().toFixed(3)),
        averageLatencyMs: Number(this.averageLatency().toFixed(1)),
        currentLoad: Number(this.currentLoad.toFixed(2))
      },
      trustEvolution: this.trustEvolution
    };
  }
}
