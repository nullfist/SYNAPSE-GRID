import { EventBus } from '../core/event-bus.js';
import { EVENT_TYPES, NODE_BEHAVIOR, NODE_STATUS } from '../core/constants.js';
import { NodeAgent } from '../core/node-agent.js';
import { DistributedNetwork } from './network.js';
import { MetricsCollector } from './metrics.js';
import { createTopology } from './topology.js';

const DEFAULT_BEHAVIORS = Object.freeze({
  A: NODE_BEHAVIOR.NORMAL,
  B: NODE_BEHAVIOR.NORMAL,
  C: NODE_BEHAVIOR.NORMAL,
  D: NODE_BEHAVIOR.NORMAL,
  E: NODE_BEHAVIOR.NORMAL,
  F: NODE_BEHAVIOR.NORMAL,
  G: NODE_BEHAVIOR.NORMAL,
  H: NODE_BEHAVIOR.NORMAL
});

export class Simulation {
  constructor({ broadcast = () => {} } = {}) {
    this.broadcastToClients = broadcast;
    this.logs = [];
    this.metrics = new MetricsCollector();
    this.topologyMode = 'mesh';
    this.scenario = 'normal';
    this.reset();
  }

  reset({ topologyMode = this.topologyMode, scenario = this.scenario } = {}) {
    this.topologyMode = topologyMode;
    this.scenario = scenario;
    this.eventBus = new EventBus();
    this.logs = [];
    this.topology = createTopology(topologyMode);
    const behaviors = this.behaviorsForScenario(scenario);
    const nodes = Object.entries(this.topology).map(([id, neighbors]) =>
      new NodeAgent({ id, neighbors, eventBus: this.eventBus, behavior: behaviors[id] })
    );
    this.network = new DistributedNetwork({
      nodes,
      eventBus: this.eventBus,
      logger: (event) => this.log(event)
    });
    this.lastRouteResult = null;
    this.setupEventListeners();
    this.metrics.record({ network: this.network, logs: this.logs, label: scenario });
    this.publish('Simulation reset');
  }

  setupEventListeners() {
    this.eventBus.on(EVENT_TYPES.NODE_FAILURE, ({ detectorId, failedNodeId }) => {
      const detector = this.network.getNode(detectorId);
      if (!detector) return;
      detector.trustManager.penalize(failedNodeId, 0.14, 'failure');
      const notice = detector.createFailureNotice(failedNodeId);
      this.network.broadcast(detectorId, notice);
      this.log({
        kind: 'failure-detected',
        detectorId,
        failedNodeId,
        timestamp: Date.now()
      });
    });
  }

  log(event) {
    this.logs.unshift(event);
    this.logs = this.logs.slice(0, 160);
  }

  tick() {
    this.network.tick();
    this.metrics.record({ network: this.network, logs: this.logs, label: this.scenario });
    this.publish('tick');
  }

  sendData({ source = 'A', destination = 'H', content = 'adaptive packet' } = {}) {
    const sourceNode = this.network.getNode(source);
    if (!sourceNode || sourceNode.status === NODE_STATUS.FAILED) {
      return { ok: false, reason: 'source_unavailable' };
    }
    const packet = sourceNode.createDataPacket(destination, content);
    const result = sourceNode.routeData(packet, this.network);
    this.lastRouteResult = { source, destination, result, timestamp: Date.now() };
    this.log({
      kind: 'packet-result',
      source,
      destination,
      result,
      timestamp: Date.now()
    });
    this.metrics.record({ network: this.network, logs: this.logs, label: this.scenario });
    this.publish('data_packet');
    return { ok: true, result };
  }

  burstTraffic({ source = 'A', destination = 'H', count = 10 } = {}) {
    const results = [];
    for (let i = 0; i < count; i += 1) {
      results.push(this.sendData({ source, destination, content: `burst-${i}` }));
    }
    this.publish('burst');
    return { ok: true, results };
  }

  failNode(nodeId) {
    const node = this.network.getNode(nodeId);
    if (!node) return { ok: false, reason: 'unknown_node' };
    node.fail();
    for (const other of this.network.nodes.values()) {
      if (other.neighborIds.has(nodeId)) {
        other.trustManager.penalize(nodeId, 0.2, 'failure');
      }
    }
    this.log({ kind: 'manual-failure', nodeId, timestamp: Date.now() });
    this.publish('node_failure');
    return { ok: true };
  }

  recoverNode(nodeId) {
    const node = this.network.getNode(nodeId);
    if (!node) return { ok: false, reason: 'unknown_node' };
    node.recover();
    this.log({ kind: 'node-recovered', nodeId, timestamp: Date.now() });
    this.publish('node_recovered');
    return { ok: true };
  }

  toggleMalicious(nodeId) {
    const node = this.network.getNode(nodeId);
    if (!node) return { ok: false, reason: 'unknown_node' };
    node.toggleMalicious();
    this.log({ kind: 'malicious-toggle', nodeId, status: node.status, timestamp: Date.now() });
    this.publish('malicious_toggle');
    return { ok: true, status: node.status };
  }

  setBehavior(nodeId, behavior) {
    const node = this.network.getNode(nodeId);
    if (!node) return { ok: false, reason: 'unknown_node' };
    node.setBehavior(behavior);
    this.log({ kind: 'behavior-change', nodeId, behavior, status: node.status, timestamp: Date.now() });
    this.publish('behavior_change');
    return { ok: true };
  }

  changeTopology(mode) {
    this.reset({ topologyMode: mode, scenario: this.scenario });
    return { ok: true };
  }

  runScenario(name = 'normal') {
    this.reset({ topologyMode: this.topologyMode, scenario: name });
    const start = this.metrics.snapshot().latest;
    const actions = {
      normal: () => {
        for (let i = 0; i < 14; i += 1) this.sendData({ source: 'A', destination: 'H', content: `normal-${i}` });
      },
      attack: () => {
        this.setBehavior('B', NODE_BEHAVIOR.MALICIOUS);
        for (let i = 0; i < 18; i += 1) this.sendData({ source: i % 2 === 0 ? 'B' : 'A', destination: 'H', content: `attack-${i}` });
      },
      failure: () => {
        this.failNode('D');
        for (let i = 0; i < 16; i += 1) this.sendData({ source: 'A', destination: 'H', content: `failure-${i}` });
      },
      stress: () => {
        this.setBehavior('D', NODE_BEHAVIOR.SLOW);
        this.setBehavior('F', NODE_BEHAVIOR.UNSTABLE);
        for (let i = 0; i < 24; i += 1) this.sendData({ source: i % 3 === 0 ? 'C' : 'A', destination: 'H', content: `stress-${i}` });
      }
    };
    actions[name]?.();
    for (let i = 0; i < 5; i += 1) this.network.tick();
    const end = this.metrics.record({ network: this.network, logs: this.logs, label: name });
    this.metrics.addExperiment({
      name,
      topologyMode: this.topologyMode,
      start,
      end,
      improvement: {
        trustDelta: Number(((end?.averageTrust || 0) - (start?.averageTrust || 0)).toFixed(3)),
        reliabilityDelta: Number(((end?.averageReliability || 0) - (start?.averageReliability || 0)).toFixed(3)),
        successRate: end?.successRate || 0
      }
    });
    this.publish('scenario_complete');
    return { ok: true, summary: this.metrics.snapshot().experiments[0] };
  }

  behaviorsForScenario(scenario) {
    const behaviors = { ...DEFAULT_BEHAVIORS };
    if (scenario === 'attack') {
      behaviors.B = NODE_BEHAVIOR.MALICIOUS;
    }
    if (scenario === 'failure') {
      behaviors.F = NODE_BEHAVIOR.UNSTABLE;
    }
    if (scenario === 'stress') {
      behaviors.D = NODE_BEHAVIOR.SLOW;
      behaviors.F = NODE_BEHAVIOR.UNSTABLE;
    }
    return behaviors;
  }

  publish(reason) {
    this.broadcastToClients({
      type: 'STATE',
      reason,
      state: this.state()
    });
  }

  state() {
    return {
      ...this.network.snapshot(),
      logs: this.logs,
      lastRouteResult: this.lastRouteResult,
      topology: this.topology,
      topologyMode: this.topologyMode,
      scenario: this.scenario,
      metrics: this.metrics.snapshot(),
      behaviorTypes: Object.values(NODE_BEHAVIOR)
    };
  }
}
