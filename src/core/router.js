import { DEFAULTS, NODE_STATUS } from './constants.js';

export class Router {
  constructor(random = Math.random) {
    this.random = random;
  }

  chooseNextHop({ currentNode, destinationId, neighbors, trustManager, signalManager, pathHistory, excludedIds = [] }) {
    const excluded = new Set(excludedIds);
    const candidates = neighbors
      .filter((neighbor) => neighbor.status !== NODE_STATUS.FAILED)
      .filter((neighbor) => !pathHistory.includes(neighbor.id))
      .filter((neighbor) => !excluded.has(neighbor.id))
      .map((neighbor) => {
        const trust = trustManager.getTrust(neighbor.id);
        const successRate = trustManager.getSuccessRate(neighbor.id);
        const risk = signalManager.getRisk(neighbor.id);
        const loadPenalty = Math.min(1, (neighbor.currentLoad || 0) / DEFAULTS.overloadThreshold);
        const latencyPenalty = 1 - trustManager.getLatencyScore(neighbor.id);
        const trendScore = trustManager.getTrendScore(neighbor.id);
        const destinationBonus = neighbor.id === destinationId ? 0.75 : 0;
        const score =
          trust +
          successRate * 0.45 +
          trendScore * 0.22 -
          risk -
          loadPenalty * 0.42 -
          latencyPenalty * 0.24 +
          destinationBonus;
        return {
          id: neighbor.id,
          score: Number(score.toFixed(4)),
          trust,
          successRate,
          risk,
          loadPenalty,
          latencyPenalty,
          trendScore,
          behavior: neighbor.behavior,
          explanation: [
            `trust=${trust.toFixed(2)}`,
            `success=${successRate.toFixed(2)}`,
            `risk=${risk.toFixed(2)}`,
            `loadPenalty=${loadPenalty.toFixed(2)}`,
            `latencyPenalty=${latencyPenalty.toFixed(2)}`,
            `trend=${trendScore.toFixed(2)}`,
            neighbor.id === destinationId ? 'direct-destination-bonus' : 'neighbor-hop'
          ].join(', ')
        };
      })
      .sort((a, b) => b.score - a.score);

    if (candidates.length === 0) {
      return null;
    }

    if (this.random() < DEFAULTS.explorationRate && candidates.length > 1) {
      const explorationPool = candidates.slice(1);
      const chosen = explorationPool[Math.floor(this.random() * explorationPool.length)];
      return {
        ...chosen,
        decisionMode: 'exploration',
        candidates
      };
    }

    return {
      ...candidates[0],
      decisionMode: 'score-maximization',
      candidates
    };
  }
}
