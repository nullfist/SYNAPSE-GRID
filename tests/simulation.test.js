import test from 'node:test';
import assert from 'node:assert/strict';
import { NODE_STATUS } from '../src/core/constants.js';
import { Simulation } from '../src/server/simulation.js';

test('normal data flow reaches destination', () => {
  const simulation = new Simulation();
  const response = simulation.sendData({ source: 'A', destination: 'H' });

  assert.equal(response.ok, true);
  assert.equal(response.result.delivered, true);
});

test('failed node is avoided by adaptive routing', () => {
  const simulation = new Simulation();
  simulation.failNode('D');

  for (let i = 0; i < 3; i += 1) {
    simulation.sendData({ source: 'A', destination: 'H' });
  }

  const routeEvents = simulation.logs.filter((event) => event.kind === 'route');
  assert.equal(simulation.network.getNode('D').status, NODE_STATUS.FAILED);
  assert.ok(routeEvents.every((event) => event.to !== 'D'));
});

test('packet result includes actual source-to-destination path', () => {
  const simulation = new Simulation();
  const response = simulation.sendData({ source: 'A', destination: 'H' });

  assert.equal(response.result.path[0], 'A');
  assert.equal(response.result.path.at(-1), 'H');
  assert.ok(response.result.path.length >= 2);
});

test('manual node failure still allows alternate path from healthy source', () => {
  const simulation = new Simulation();
  simulation.failNode('D');
  const response = simulation.sendData({ source: 'A', destination: 'H' });

  assert.equal(response.ok, true);
  assert.equal(response.result.delivered, true);
  assert.ok(!response.result.path.includes('D'));
});

test('malicious traffic lowers trust and creates anomaly signals', () => {
  const simulation = new Simulation();
  simulation.toggleMalicious('B');
  simulation.burstTraffic({ source: 'B', destination: 'H', count: 8 });

  const nodeA = simulation.network.getNode('A');
  const nodeD = simulation.network.getNode('D');
  const trustFromA = nodeA.trustManager.getTrust('B');
  const trustFromD = nodeD.trustManager.getTrust('B');
  const signalEvents = simulation.logs.filter((event) => event.kind === 'signal');

  assert.ok(trustFromA < 0.62 || trustFromD < 0.62);
  assert.ok(signalEvents.length > 0);
});

test('recovered node becomes active and can regain trust over time', () => {
  const simulation = new Simulation();
  simulation.failNode('D');
  const before = simulation.network.getNode('B').trustManager.getTrust('D');

  simulation.recoverNode('D');
  for (let i = 0; i < 5; i += 1) {
    simulation.tick();
  }

  const after = simulation.network.getNode('B').trustManager.getTrust('D');
  assert.equal(simulation.network.getNode('D').status, NODE_STATUS.ACTIVE);
  assert.ok(after > before);
});
