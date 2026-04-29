import test from 'node:test';
import assert from 'node:assert/strict';
import { Router } from '../src/core/router.js';
import { TrustManager } from '../src/core/trust-manager.js';
import { SignalManager } from '../src/core/signal-manager.js';

test('router avoids failed nodes and high-risk neighbors', () => {
  const trustManager = new TrustManager('A', ['B', 'C']);
  const signalManager = new SignalManager();
  const router = new Router(() => 0.99);

  trustManager.reward('B', 0.2);
  trustManager.reward('C', 0.05);
  signalManager.observe('B', 0.9);

  const nextHop = router.chooseNextHop({
    currentNode: { id: 'A' },
    destinationId: 'H',
    neighbors: [
      { id: 'B', status: 'ACTIVE' },
      { id: 'C', status: 'ACTIVE' },
      { id: 'D', status: 'FAILED' }
    ],
    trustManager,
    signalManager,
    pathHistory: ['A']
  });

  assert.equal(nextHop.id, 'C');
});

test('router returns null when every neighbor is failed or already visited', () => {
  const trustManager = new TrustManager('A', ['B']);
  const signalManager = new SignalManager();
  const router = new Router(() => 0.99);

  const nextHop = router.chooseNextHop({
    currentNode: { id: 'A' },
    destinationId: 'H',
    neighbors: [{ id: 'B', status: 'ACTIVE' }],
    trustManager,
    signalManager,
    pathHistory: ['A', 'B']
  });

  assert.equal(nextHop, null);
});
