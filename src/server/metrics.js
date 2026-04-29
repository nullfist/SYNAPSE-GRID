export class MetricsCollector {
  constructor(limit = 120) {
    this.limit = limit;
    this.samples = [];
    this.experiments = [];
  }

  record({ network, logs, label = 'live' }) {
    const packetResults = logs.filter((event) => event.kind === 'packet-result');
    const routeEvents = logs.filter((event) => event.kind === 'route');
    const delivered = packetResults.filter((event) => event.result?.delivered).length;
    const failed = packetResults.length - delivered;
    const averageLatency = average(routeEvents.map((event) => event.latencyMs).filter(Number.isFinite));
    const averageLoad = average([...network.nodes.values()].map((node) => node.currentLoad));
    const averageReliability = average([...network.nodes.values()].map((node) => node.reliability()));
    const averageTrust = average([...network.nodes.values()].map((node) => node.averageTrust()));

    const sample = {
      label,
      timestamp: Date.now(),
      packets: packetResults.length,
      delivered,
      failed,
      successRate: packetResults.length === 0 ? 1 : delivered / packetResults.length,
      averageLatencyMs: averageLatency,
      averageLoad,
      averageReliability,
      averageTrust
    };
    this.samples.push(roundSample(sample));
    this.samples = this.samples.slice(-this.limit);
    return roundSample(sample);
  }

  addExperiment(summary) {
    this.experiments.unshift({
      ...summary,
      timestamp: Date.now()
    });
    this.experiments = this.experiments.slice(0, 8);
  }

  snapshot() {
    return {
      latest: this.samples[this.samples.length - 1] || null,
      history: this.samples,
      experiments: this.experiments
    };
  }
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function roundSample(sample) {
  return {
    ...sample,
    successRate: Number(sample.successRate.toFixed(3)),
    averageLatencyMs: Number(sample.averageLatencyMs.toFixed(1)),
    averageLoad: Number(sample.averageLoad.toFixed(2)),
    averageReliability: Number(sample.averageReliability.toFixed(3)),
    averageTrust: Number(sample.averageTrust.toFixed(3))
  };
}
