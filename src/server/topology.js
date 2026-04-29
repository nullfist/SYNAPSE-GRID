export const BASE_TOPOLOGY = Object.freeze({
  A: ['B', 'C'],
  B: ['A', 'D', 'E'],
  C: ['A', 'D', 'F'],
  D: ['B', 'C', 'E', 'G'],
  E: ['B', 'D', 'H'],
  F: ['C', 'G'],
  G: ['D', 'F', 'H'],
  H: ['E', 'G']
});

export function createTopology(mode = 'mesh') {
  if (mode === 'random') {
    return randomConnectedTopology(Object.keys(BASE_TOPOLOGY));
  }
  if (mode === 'ring') {
    return ringTopology(Object.keys(BASE_TOPOLOGY));
  }
  return cloneTopology(BASE_TOPOLOGY);
}

function cloneTopology(topology) {
  return Object.fromEntries(Object.entries(topology).map(([id, neighbors]) => [id, [...neighbors]]));
}

function ringTopology(ids) {
  const topology = Object.fromEntries(ids.map((id) => [id, []]));
  ids.forEach((id, index) => {
    connect(topology, id, ids[(index + 1) % ids.length]);
    connect(topology, id, ids[(index + 2) % ids.length]);
  });
  return topology;
}

function randomConnectedTopology(ids) {
  const topology = Object.fromEntries(ids.map((id) => [id, []]));
  for (let index = 1; index < ids.length; index += 1) {
    connect(topology, ids[index - 1], ids[index]);
  }
  for (let i = 0; i < ids.length; i += 1) {
    for (let j = i + 2; j < ids.length; j += 1) {
      if (Math.random() < 0.28) {
        connect(topology, ids[i], ids[j]);
      }
    }
  }
  return topology;
}

function connect(topology, a, b) {
  if (!topology[a].includes(b)) topology[a].push(b);
  if (!topology[b].includes(a)) topology[b].push(a);
}
