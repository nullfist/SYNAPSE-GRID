const canvas = document.getElementById('networkCanvas');
const ctx = canvas.getContext('2d');
const connection = document.getElementById('connection');
const sourceSelect = document.getElementById('sourceNode');
const destinationSelect = document.getElementById('destinationNode');
const targetSelect = document.getElementById('targetNode');
const behaviorSelect = document.getElementById('behaviorType');
const topologySelect = document.getElementById('topologyMode');
const eventLog = document.getElementById('eventLog');
const nodeDetails = document.getElementById('nodeDetails');
const metricsPanel = document.getElementById('metrics');
const metricsCanvas = document.getElementById('metricsCanvas');
const metricsCtx = metricsCanvas.getContext('2d');
const trustCanvas = document.getElementById('trustCanvas');
const trustCtx = trustCanvas.getContext('2d');
const intelPanel = document.getElementById('intelPanel');
const screenStatus = document.getElementById('screenStatus');

const defaultPositions = {
  A: { x: 160, y: 180 },
  B: { x: 370, y: 110 },
  C: { x: 360, y: 300 },
  D: { x: 585, y: 210 },
  E: { x: 780, y: 115 },
  F: { x: 585, y: 420 },
  G: { x: 780, y: 350 },
  H: { x: 975, y: 235 }
};

const positions = clonePositions(defaultPositions);
let state = null;
let selectedNode = null;
let draggedNode = null;
let dragOffset = { x: 0, y: 0 };
let pointerMoved = false;
let activePacket = null;
let pulse = 0;

const socket = new WebSocket(`ws://${window.location.host}`);

socket.addEventListener('open', () => {
  connection.textContent = 'Connected';
  connection.classList.add('online');
});

socket.addEventListener('close', () => {
  connection.textContent = 'Disconnected';
  connection.classList.remove('online');
});

socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.type === 'STATE') {
    state = message.state;
    syncPacketAnimation();
    syncSelectors();
    syncScreenStatus();
    renderMetrics();
    renderDetails();
    renderLog();
    draw();
  }
});

function send(type, payload = {}) {
  socket.send(JSON.stringify({ type, payload }));
}

document.getElementById('sendData').addEventListener('click', () => {
  send('SEND_DATA', { source: sourceSelect.value, destination: destinationSelect.value });
});

document.getElementById('burstTraffic').addEventListener('click', () => {
  send('BURST_TRAFFIC', { source: sourceSelect.value, destination: destinationSelect.value, count: 10 });
});

document.getElementById('failNode').addEventListener('click', () => {
  send('FAIL_NODE', { nodeId: targetSelect.value });
});

document.getElementById('recoverNode').addEventListener('click', () => {
  send('RECOVER_NODE', { nodeId: targetSelect.value });
});

document.getElementById('toggleMalicious').addEventListener('click', () => {
  send('TOGGLE_MALICIOUS', { nodeId: targetSelect.value });
});

document.getElementById('setBehavior').addEventListener('click', () => {
  send('SET_BEHAVIOR', { nodeId: targetSelect.value, behavior: behaviorSelect.value });
});

topologySelect.addEventListener('change', () => {
  selectedNode = null;
  send('CHANGE_TOPOLOGY', { mode: topologySelect.value });
});

document.querySelectorAll('.scenario').forEach((button) => {
  button.addEventListener('click', () => {
    selectedNode = null;
    send('RUN_SCENARIO', { name: button.dataset.scenario });
  });
});

document.getElementById('reset').addEventListener('click', () => {
  selectedNode = null;
  send('RESET', { topologyMode: topologySelect.value });
});

document.getElementById('resetLayout').addEventListener('click', () => {
  Object.assign(positions, clonePositions(defaultPositions));
  draw();
});

document.getElementById('loadIntel').addEventListener('click', async () => {
  intelPanel.textContent = 'Loading URLhaus context...';
  try {
    const response = await fetch('/api/external-intelligence/urlhaus');
    const data = await response.json();
    intelPanel.innerHTML = `
      <strong>${data.provider}</strong><br>
      ${data.message}<br>
      ${data.samples
        .slice(0, 4)
        .map((sample) => `${sample.fileType || 'sample'} | ${sample.signature || sample.sha256}`)
        .join('<br>')}
    `;
  } catch (error) {
    intelPanel.textContent = `Threat context unavailable: ${error.message}`;
  }
});

canvas.addEventListener('pointerdown', (event) => {
  if (!state) return;
  const point = getCanvasPoint(event);
  const node = findNodeAt(point.x, point.y);
  if (node) {
    selectedNode = node.id;
    draggedNode = node.id;
    pointerMoved = false;
    dragOffset = {
      x: positions[node.id].x - point.x,
      y: positions[node.id].y - point.y
    };
    canvas.classList.add('dragging');
    canvas.setPointerCapture(event.pointerId);
    renderDetails();
    draw();
  }
});

canvas.addEventListener('pointermove', (event) => {
  if (!draggedNode) return;
  const point = getCanvasPoint(event);
  positions[draggedNode] = {
    x: clamp(point.x + dragOffset.x, 70, canvas.width - 70),
    y: clamp(point.y + dragOffset.y, 80, canvas.height - 90)
  };
  pointerMoved = true;
  draw();
});

canvas.addEventListener('pointerup', (event) => {
  if (draggedNode) {
    canvas.releasePointerCapture(event.pointerId);
  }
  draggedNode = null;
  canvas.classList.remove('dragging');
  if (!pointerMoved) {
    renderDetails();
  }
});

canvas.addEventListener('pointercancel', () => {
  draggedNode = null;
  canvas.classList.remove('dragging');
});

function syncSelectors() {
  if (!state) return;
  if (!sourceSelect.options.length) {
    for (const node of state.nodes) {
      sourceSelect.add(new Option(node.id, node.id));
      destinationSelect.add(new Option(node.id, node.id));
      targetSelect.add(new Option(node.id, node.id));
    }
    sourceSelect.value = 'A';
    destinationSelect.value = 'H';
    targetSelect.value = 'D';
  }
  if (!behaviorSelect.options.length) {
    for (const behavior of state.behaviorTypes || []) {
      behaviorSelect.add(new Option(behavior, behavior));
    }
  }
  topologySelect.value = state.topologyMode || topologySelect.value;
}

function syncScreenStatus() {
  if (!state) return;
  const active = state.nodes.filter((node) => node.status !== 'FAILED').length;
  screenStatus.textContent = `${active}/${state.nodes.length} nodes established`;
}

function draw() {
  if (!state) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  drawLinks();
  drawSignals();
  drawPacket();
  drawNodes();
  drawLegend();
}

function drawGrid() {
  ctx.strokeStyle = '#1d242c';
  ctx.lineWidth = 1;
  for (let x = 40; x < canvas.width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 40; y < canvas.height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function drawLinks() {
  for (const link of state.links) {
    const a = positions[link.source];
    const b = positions[link.target];
    const trust = (link.trustForward + link.trustBackward) / 2;
    ctx.strokeStyle = trustColor(trust, 0.62);
    ctx.lineWidth = 2 + trust * 4;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  const routeEvents = state.logs.filter((event) => event.kind === 'route').slice(0, 10);
  for (const event of routeEvents) {
    const a = positions[event.from];
    const b = positions[event.to];
    if (!a || !b) continue;
    const age = Math.min(1, (Date.now() - event.timestamp) / 3000);
    ctx.strokeStyle = `rgba(74, 168, 255, ${1 - age})`;
    ctx.lineWidth = 8 * (1 - age) + 1;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
}

function drawSignals() {
  const signals = state.logs.filter((event) => event.kind === 'signal').slice(0, 14);
  for (const event of signals) {
    const a = positions[event.from];
    const b = positions[event.to];
    if (!a || !b) continue;
    const age = Math.min(1, (Date.now() - event.timestamp) / 4000);
    ctx.strokeStyle = `rgba(255, 92, 118, ${1 - age})`;
    ctx.setLineDash([8, 8]);
    ctx.lineWidth = 2 + event.strength * 5;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function syncPacketAnimation() {
  const result = state?.lastRouteResult;
  if (!result?.timestamp) return;

  const path = Array.isArray(result.result?.path) && result.result.path.length >= 2
    ? result.result.path
    : buildRouteFromLogs(result.timestamp);
  if (path.length < 2) return;

  if (!activePacket || activePacket.timestamp !== result.timestamp) {
    activePacket = {
      timestamp: result.timestamp,
      path,
      startedAt: performance.now()
    };
  }
}

function buildRouteFromLogs(timestamp) {
  const routeEvents = state.logs
    .filter((event) => event.kind === 'route')
    .filter((event) => Math.abs(event.timestamp - timestamp) < 1400)
    .reverse();

  if (!routeEvents.length) return [];

  const path = [routeEvents[0].from];
  for (const event of routeEvents) {
    if (path[path.length - 1] !== event.from) {
      path.push(event.from);
    }
    path.push(event.to);
  }

  return path.filter((id) => positions[id]);
}

function drawPacket() {
  if (!activePacket || activePacket.path.length < 2) return;

  const durationPerHop = 620;
  const elapsed = performance.now() - activePacket.startedAt;
  const hopCount = activePacket.path.length - 1;
  const totalDuration = hopCount * durationPerHop;

  if (elapsed > totalDuration + 500) {
    activePacket = null;
    return;
  }

  const hopProgress = Math.min(hopCount - 0.001, elapsed / durationPerHop);
  const hopIndex = Math.floor(hopProgress);
  const localProgress = hopProgress - hopIndex;
  const from = positions[activePacket.path[hopIndex]];
  const to = positions[activePacket.path[hopIndex + 1]];
  if (!from || !to) return;

  const eased = easeInOut(localProgress);
  const x = from.x + (to.x - from.x) * eased;
  const y = from.y + (to.y - from.y) * eased;

  ctx.save();
  ctx.shadowColor = '#4aa8ff';
  ctx.shadowBlur = 18;
  ctx.fillStyle = '#edf2f7';
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#4aa8ff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 13 + Math.sin(pulse * 2) * 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = '#edf2f7';
  ctx.font = '12px Segoe UI';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PACKET', x, y - 24);
}

function drawNodes() {
  for (const node of state.nodes) {
    const pos = positions[node.id];
    const averageTrust = average(Object.values(node.trust).map((entry) => entry.trust));
    const radius = selectedNode === node.id ? 36 : 30;

    if (Object.keys(node.signals).length > 0) {
      ctx.strokeStyle = `rgba(255, 92, 118, ${0.45 + Math.sin(pulse) * 0.15})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius + 15, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = statusColor(node.status, averageTrust);
    ctx.strokeStyle = selectedNode === node.id ? '#edf2f7' : '#111418';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#101318';
    ctx.font = '700 18px Segoe UI';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.id, pos.x, pos.y);

    ctx.fillStyle = '#95a1ad';
    ctx.font = '12px Segoe UI';
    ctx.fillText(`${node.behavior} | load ${node.metrics.currentLoad}`, pos.x, pos.y + 48);
  }
}

function getCanvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height)
  };
}

function findNodeAt(x, y) {
  for (const node of state.nodes) {
    const pos = positions[node.id];
    const distance = Math.hypot(pos.x - x, pos.y - y);
    if (distance < 38) {
      return node;
    }
  }
  return null;
}

function clonePositions(source) {
  return Object.fromEntries(Object.entries(source).map(([id, pos]) => [id, { ...pos }]));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function easeInOut(value) {
  return value < 0.5 ? 2 * value * value : 1 - Math.pow(-2 * value + 2, 2) / 2;
}

function drawLegend() {
  const items = [
    ['trusted', '#39d98a'],
    ['uncertain', '#f5b451'],
    ['risky/failed', '#ff5c76'],
    ['live route', '#4aa8ff'],
    ['packet dot', '#edf2f7']
  ];
  ctx.font = '13px Segoe UI';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  items.forEach(([label, color], index) => {
    const y = 32 + index * 26;
    ctx.fillStyle = color;
    ctx.fillRect(24, y - 7, 14, 14);
    ctx.fillStyle = '#cbd5df';
    ctx.fillText(label, 48, y);
  });
}

function renderDetails() {
  if (!state || !selectedNode) {
    nodeDetails.textContent = 'Select a node on the graph.';
    return;
  }
  const node = state.nodes.find((item) => item.id === selectedNode);
  if (!node) return;
  const trustRows = Object.entries(node.trust)
    .map(([id, entry]) => {
      const pct = Math.round(entry.trust * 100);
      return `<div class="trust-row"><span>${id}</span><div class="bar"><span style="width:${pct}%; background:${trustColor(entry.trust)}"></span></div><span>${pct}%</span></div>
        <div class="details">rel ${entry.reliability} | lat ${entry.latencyScore} | anom ${entry.anomalyScore} | sig ${entry.signalScore} | trend ${entry.trendScore}</div>`;
    })
    .join('');
  nodeDetails.innerHTML = `
    <strong>Node ${node.id}</strong><br>
    Status: ${node.status}<br>
    Behavior: ${node.behavior}<br>
    Neighbors: ${node.neighbors.join(', ')}<br>
    Received: ${node.metrics.receivedPackets}, Forwarded: ${node.metrics.forwardedPackets}, Dropped: ${node.metrics.droppedPackets}<br>
    Reliability: ${node.metrics.reliability}, Latency: ${node.metrics.averageLatencyMs}ms, Load: ${node.metrics.currentLoad}
    <div style="margin-top:10px">${trustRows}</div>
  `;
  drawTrustChart(node);
}

function renderLog() {
  if (!state) return;
  eventLog.innerHTML = state.logs
    .slice(0, 22)
    .map((event) => `<div class="event">${formatEvent(event)}</div>`)
    .join('');
}

function renderMetrics() {
  const latest = state?.metrics?.latest;
  if (!latest) return;
  metricsPanel.innerHTML = [
    ['Success', `${Math.round(latest.successRate * 100)}%`],
    ['Latency', `${latest.averageLatencyMs}ms`],
    ['Reliability', `${Math.round(latest.averageReliability * 100)}%`],
    ['Avg Trust', `${Math.round(latest.averageTrust * 100)}%`]
  ]
    .map(([label, value]) => `<div class="metric"><strong>${value}</strong><span>${label}</span></div>`)
    .join('');
  drawMetricsChart();
}

function formatEvent(event) {
  if (event.kind === 'route') {
    return `Route ${event.from} -> ${event.to} | trust ${Number(event.trustWeight).toFixed(2)} | ${event.latencyMs}ms | load ${event.load}`;
  }
  if (event.kind === 'decision') {
    const candidates = event.candidates
      .slice(0, 3)
      .map((candidate) => `${candidate.id}:${candidate.score}`)
      .join(', ');
    return `Decision at ${event.nodeId}: chose ${event.chosen} by ${event.mode}. trust ${event.trust}, risk ${event.risk}, score ${event.score}. ${event.explanation}. Candidates ${candidates}`;
  }
  if (event.kind === 'reroute') {
    return `Reroute at ${event.nodeId}: avoided ${event.avoided} because ${event.reason}; trying ${event.remainingCandidates} alternate candidate(s)`;
  }
  if (event.kind === 'signal') {
    return `Signal ${event.from} -> ${event.to} | source ${event.source} | strength ${event.strength}`;
  }
  if (event.kind === 'packet-result') {
    return `Packet ${event.source} -> ${event.destination} | ${event.result.reason}`;
  }
  if (event.kind === 'manual-failure') {
    return `Node ${event.nodeId} failed`;
  }
  if (event.kind === 'node-recovered') {
    return `Node ${event.nodeId} recovered`;
  }
  if (event.kind === 'malicious-toggle') {
    return `Node ${event.nodeId} status changed to ${event.status}`;
  }
  if (event.kind === 'behavior-change') {
    return `Node ${event.nodeId} behavior changed to ${event.behavior}`;
  }
  if (event.kind === 'failure-detected') {
    return `${event.detectorId} detected failure at ${event.failedNodeId}`;
  }
  return event.kind;
}

function drawMetricsChart() {
  const history = state?.metrics?.history || [];
  metricsCtx.clearRect(0, 0, metricsCanvas.width, metricsCanvas.height);
  chartFrame(metricsCtx, metricsCanvas);
  drawSeries(metricsCtx, metricsCanvas, history.map((item) => item.successRate), '#39d98a');
  drawSeries(metricsCtx, metricsCanvas, history.map((item) => item.averageTrust), '#4aa8ff');
  drawSeries(metricsCtx, metricsCanvas, history.map((item) => item.averageReliability), '#f5b451');
}

function drawTrustChart(node) {
  trustCtx.clearRect(0, 0, trustCanvas.width, trustCanvas.height);
  chartFrame(trustCtx, trustCanvas);
  drawSeries(trustCtx, trustCanvas, node.trustEvolution.map((item) => item.averageTrust), '#4aa8ff');
  drawSeries(trustCtx, trustCanvas, node.trustEvolution.map((item) => item.reliability), '#39d98a');
}

function chartFrame(context, target) {
  context.strokeStyle = '#343d49';
  context.lineWidth = 1;
  context.strokeRect(0.5, 0.5, target.width - 1, target.height - 1);
}

function drawSeries(context, target, values, color) {
  if (values.length < 2) return;
  context.strokeStyle = color;
  context.lineWidth = 2;
  context.beginPath();
  values.forEach((value, index) => {
    const x = 8 + (index / (values.length - 1)) * (target.width - 16);
    const y = target.height - 8 - Math.max(0, Math.min(1, value)) * (target.height - 16);
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.stroke();
}

function trustColor(value, alpha = 1) {
  if (value >= 0.66) return `rgba(57, 217, 138, ${alpha})`;
  if (value >= 0.38) return `rgba(245, 180, 81, ${alpha})`;
  return `rgba(255, 92, 118, ${alpha})`;
}

function statusColor(status, trust) {
  if (status === 'FAILED') return '#ff5c76';
  if (status === 'MALICIOUS') return '#f5b451';
  return trust >= 0.55 ? '#39d98a' : '#f5b451';
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function animate() {
  pulse += 0.05;
  if (state) draw();
  requestAnimationFrame(animate);
}

animate();
