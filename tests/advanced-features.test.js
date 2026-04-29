import test from 'node:test';
import assert from 'node:assert/strict';
import { NODE_BEHAVIOR } from '../src/core/constants.js';
import { Simulation } from '../src/server/simulation.js';

test('slow behavior increases observed latency and affects metrics', () => {
  const simulation = new Simulation();
  simulation.setBehavior('B', NODE_BEHAVIOR.SLOW);
  simulation.sendData({ source: 'A', destination: 'H' });

  const routeToB = simulation.logs.find((event) => event.kind === 'route' && event.to === 'B');
  assert.ok(routeToB.latencyMs >= 420);
  assert.ok(simulation.state().metrics.latest.averageLatencyMs > 0);
});

test('experiment mode stores comparable scenario summaries', () => {
  const simulation = new Simulation();
  const response = simulation.runScenario('attack');
  const experiments = simulation.state().metrics.experiments;

  assert.equal(response.ok, true);
  assert.equal(experiments[0].name, 'attack');
  assert.ok(typeof experiments[0].improvement.successRate === 'number');
});

test('dynamic topology mode changes neighbor structure without route controller', () => {
  const simulation = new Simulation();
  const before = JSON.stringify(simulation.state().topology);

  simulation.changeTopology('ring');
  const after = JSON.stringify(simulation.state().topology);

  assert.notEqual(after, before);
  assert.equal(simulation.sendData({ source: 'A', destination: 'H' }).ok, true);
});

test('decision logs explain why next hop was selected', () => {
  const simulation = new Simulation();
  simulation.sendData({ source: 'A', destination: 'H' });

  const decision = simulation.logs.find((event) => event.kind === 'decision');
  assert.ok(decision.explanation.includes('trust='));
  assert.ok(Array.isArray(decision.candidates));
});
