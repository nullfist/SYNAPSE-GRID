import { EVENT_TYPES, NODE_STATUS } from '../core/constants.js';

export class DistributedNetwork {
  constructor({ nodes, eventBus, logger = () => {} }) {
    this.nodes = new Map(nodes.map((node) => [node.id, node]));
    this.eventBus = eventBus;
    this.logger = logger;
  }

  getNode(id) {
    return this.nodes.get(id);
  }

  getNeighbors(nodeId) {
    const node = this.getNode(nodeId);
    if (!node) return [];
    return [...node.neighborIds]
      .map((id) => this.getNode(id))
      .filter(Boolean);
  }

  deliver(fromId, toId, message) {
    const target = this.getNode(toId);
    const simulatedLatency = target ? this.simulatedLatency(target) : 0;
    const simulatedLoad = target?.currentLoad || 0;
    this.logger({
      kind: 'route',
      from: fromId,
      to: toId,
      type: message.type,
      path: message.path_history,
      trustWeight: message.trust_weight,
      latencyMs: simulatedLatency,
      load: Number(simulatedLoad.toFixed(2)),
      timestamp: Date.now()
    });

    if (!target || target.status === NODE_STATUS.FAILED) {
      this.eventBus.emit(EVENT_TYPES.NODE_FAILURE, {
        detectorId: fromId,
        failedNodeId: toId
      });
      return { delivered: false, reason: 'target_failed', latencyMs: simulatedLatency, load: simulatedLoad };
    }

    if (Math.random() < target.profile.dropRate) {
      this.eventBus.emit(EVENT_TYPES.NODE_FAILURE, {
        detectorId: fromId,
        failedNodeId: toId
      });
      return {
        delivered: false,
        reason: 'profile_drop',
        latencyMs: simulatedLatency,
        load: simulatedLoad
      };
    }

    const result = target.receive(message, this);
    return {
      ...result,
      latencyMs: (result.latencyMs || 0) + simulatedLatency,
      load: target.currentLoad
    };
  }

  broadcast(fromId, message) {
    const source = this.getNode(fromId);
    if (!source || source.status === NODE_STATUS.FAILED) return;

    for (const neighborId of source.neighborIds) {
      if (message.path_history.includes(neighborId)) continue;
      const neighbor = this.getNode(neighborId);
      if (!neighbor || neighbor.status === NODE_STATUS.FAILED) continue;
      const strength = message.payload.strength ?? message.trust_weight ?? 0;
      this.logger({
        kind: message.type === EVENT_TYPES.ANOMALY_SIGNAL ? 'signal' : 'notice',
        from: fromId,
        to: neighborId,
        source: message.payload.sourceId ?? message.payload.failedNodeId,
        strength: Number(strength.toFixed(3)),
        reasons: message.payload.reasons,
        timestamp: Date.now()
      });
      neighbor.receive(message, this);
    }
  }

  tick() {
    for (const node of this.nodes.values()) {
      node.tick();
    }
  }

  logDecision(decision) {
    this.logger({
      kind: 'decision',
      ...decision
    });
  }

  simulatedLatency(node) {
    const jitter = 30 + Math.floor(Math.random() * 90);
    const loadDelay = Math.round((node.currentLoad || 0) * 22);
    return node.profile.latencyMs + jitter + loadDelay;
  }

  snapshot() {
    return {
      nodes: [...this.nodes.values()].map((node) => node.snapshot()),
      links: this.links()
    };
  }

  links() {
    const seen = new Set();
    const links = [];
    for (const node of this.nodes.values()) {
      for (const neighborId of node.neighborIds) {
        const key = [node.id, neighborId].sort().join(':');
        if (seen.has(key)) continue;
        seen.add(key);
        links.push({
          source: node.id,
          target: neighborId,
          trustForward: node.trustManager.getTrust(neighborId),
          trustBackward: this.getNode(neighborId)?.trustManager.getTrust(node.id) ?? 0
        });
      }
    }
    return links;
  }
}
