import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS } from '../src/core/constants.js';
import { TrustManager } from '../src/core/trust-manager.js';

test('trust increases after success and decreases after anomaly', () => {
  const manager = new TrustManager('A', ['B']);
  const initial = manager.getTrust('B');

  manager.reward('B');
  assert.ok(manager.getTrust('B') > initial);

  manager.penalize('B', 0.25, 'anomaly');
  assert.ok(manager.getTrust('B') < initial);
  assert.equal(manager.getStats('B').anomalies, 1);
});

test('trust recovers gradually toward neutral baseline', () => {
  const manager = new TrustManager('A', ['B']);
  manager.penalize('B', 0.4, 'failure');
  const damaged = manager.getTrust('B');

  manager.recover('B');
  assert.ok(manager.getTrust('B') > damaged);
  assert.ok(manager.getTrust('B') <= DEFAULTS.initialTrust);
});
