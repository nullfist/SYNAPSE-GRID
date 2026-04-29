# SYNAPSE GRID

A Self-Adaptive Distributed Multi-Agent System

SYNAPSE GRID is a final-year academic prototype that demonstrates decentralized decision-making using rule-based adaptive agents. Eight independent nodes form a simulated network where each node makes local routing decisions based on trust scores, interaction history, anomaly signals, and observed neighbor behavior. There is no machine learning model, no neural network, and no central controller. All emergent behavior arises from distributed local rules.

---

## How It Works

Each node maintains its own trust table for every neighbor. When a data packet arrives, the node scores all available neighbors using a weighted formula and forwards the packet to the highest-scoring candidate. If that hop fails, the node retries with the next best candidate without any central coordination. Trust values evolve continuously through rewards, penalties, decay, and signal propagation.

The routing score formula is:

```
score = trust + (success_rate * 0.45) + (trend * 0.22) - risk - (load_penalty * 0.42) - (latency_penalty * 0.24) + destination_bonus
```

Trust itself is a weighted composite:

```
trust = (reliability * 0.38) + (latency_score * 0.20) + (anomaly_score * 0.24) + (signal_score * 0.18) + trend_boost
```

Anomaly signals propagate hop by hop with distance-based decay. Nodes that receive enough signal evidence independently penalize the flagged source without being told to do so. Node isolation is an emergent outcome, not a programmed rule.

---

## Features

- Eight independent nodes with local trust tables and interaction history
- Event-driven message handling over WebSockets
- Weighted trust model using reliability, latency, anomaly frequency, and signal influence
- Temporal trend memory tracking recent success rate direction
- Dynamic trust decay toward a neutral baseline and gradual recovery after failure
- Node behavior profiles: normal, slow, malicious, unstable
- Adaptive routing with load-aware scoring and latency penalties
- Random exploration at 18% probability to avoid fixed route lock-in
- Direct destination bonus to prefer one-hop delivery when available
- Rule-based anomaly detection covering message frequency, structural validity, integrity flags, and origin inconsistency
- Signal propagation with distance-based strength decay
- Self-healing rerouting after node failure with automatic retry across remaining candidates
- Dynamic topology modes: adaptive mesh, ring with shortcuts, randomized connected graph
- Experiment mode for normal, attack, failure, and stress scenarios with comparable metrics
- Live metrics: success rate, latency, reliability, load, and trust evolution over time
- Live browser visualization of nodes, links, routing activity, anomaly signals, isolation state, and trust levels
- Contained network simulation canvas with draggable nodes
- Animated packet dot moving hop by hop through the actual returned route path
- Optional URLhaus abuse.ch threat-intelligence enrichment for academic demo context

---

## Project Structure

```
synapse-grid/
  src/
    core/
      node-agent.js          Individual node with routing, anomaly handling, and trust logic
      trust-manager.js       Weighted trust computation with temporal memory
      router.js              Scoring and next-hop selection with exploration
      anomaly-detector.js    Rule-based inspection of incoming messages
      signal-manager.js      Signal observation, decay, and risk scoring
      temporal-memory.js     Sliding window of interaction samples for trend analysis
      behavior-profiles.js   Latency, drop rate, and load multiplier per behavior type
      event-bus.js           Lightweight publish-subscribe event system
      message.js             Message factory with type, payload, path history, and trust weight
      constants.js           All tunable parameters and enumerated types
    server/
      index.js               Express HTTP server and WebSocket handler
      simulation.js          Simulation lifecycle, scenario runner, and state publisher
      network.js             Distributed network delivery, broadcast, and link snapshot
      topology.js            Mesh, ring, and random connected graph generators
      metrics.js             Packet success rate, latency, reliability, and trust aggregation
      external-intelligence.js  Optional URLhaus abuse.ch enrichment endpoint
    public/
      index.html             Browser UI layout
      styles.css             Dark theme styling
      app.js                 Canvas rendering, WebSocket client, and control bindings
  tests/
    simulation.test.js       End-to-end routing, failure, recovery, and malicious behavior tests
    router.test.js           Next-hop selection and exclusion logic tests
    trust-manager.test.js    Trust reward, penalty, and recovery tests
    advanced-features.test.js  Latency profiling, experiment mode, topology change, and decision log tests
  docs/
    PROJECT_REPORT.md
    EVALUATION_RESULTS.md
    INTELLIGENCE_JUSTIFICATION.md
    LIMITATIONS_AND_FUTURE_WORK.md
    DEMO_NARRATIVE.md
    DEMO_SCRIPT.md
    DIAGRAMS.md
    VIVA_QA.md
    STEP_BY_STEP_WORKING.md
    TEST_CASES.md
```

---

## Setup

Requires Node.js 18 or newer. No build step is needed.

```bash
npm install
npm start
```

Open in a browser:

```
http://localhost:3000
```

---

## Demo Controls

| Control | Description |
|---|---|
| Send Data Packet | Routes a packet from source to destination using adaptive scoring |
| Source / Destination | Selects the packet origin and target node |
| Control Target | Selects which node receives manual actions |
| Fail Node | Marks the target as failed and triggers rerouting from healthy sources |
| Recover Node | Restores the target to active with gradual trust recovery |
| Toggle Malicious | Switches the target between normal and malicious behavior |
| Set Behavior | Assigns a behavior profile: normal, slow, malicious, or unstable |
| Topology | Rebuilds the network as mesh, ring, or random connected graph |
| Experiment Mode | Runs a named scenario (normal, attack, failure, stress) and records metrics |
| Burst Traffic | Sends ten packets rapidly to trigger anomaly frequency detection |
| Load URLhaus Context | Fetches optional live threat-intelligence samples from URLhaus abuse.ch |
| Reset Simulation | Restarts the full network state |
| Reset Layout | Restores dragged nodes to their default canvas positions |
| Packet Dot | Animated dot that travels hop by hop through the actual returned route path |

---

## Node Behavior Profiles

| Profile | Latency | Anomaly Rate | Drop Rate | Load Multiplier |
|---|---|---|---|---|
| Normal | 80ms | 0% | 0% | 1.0x |
| Slow | 420ms | 0% | 0% | 1.35x |
| Malicious | 110ms | 85% | 8% | 1.1x |
| Unstable | 180ms | 12% | 32% | 1.6x |

---

## Experiment Scenarios

| Scenario | Setup | Packets Sent |
|---|---|---|
| Normal | All nodes default | 14 |
| Attack | Node B set to malicious | 18 (alternating B and A as source) |
| Failure | Node D failed | 16 |
| Stress | Node D slow, Node F unstable | 24 (rotating sources) |

Each scenario records a before and after snapshot of average trust, reliability, and success rate for comparison.

---

## Tests

```bash
npm test
```

All 14 tests pass. Coverage includes:

- Normal data flow reaching destination
- Failed node avoided by adaptive routing
- Path history included in packet result
- Alternate route found after manual node failure
- Malicious traffic lowering trust and generating anomaly signals
- Recovered node returning to active and regaining trust
- Slow behavior increasing observed latency
- Experiment mode storing comparable scenario summaries
- Dynamic topology change without breaking routing
- Decision logs explaining next-hop selection with trust, risk, and score values
- Router avoiding failed nodes and high-risk neighbors
- Router returning null when all candidates are exhausted
- Trust increasing after success and decreasing after anomaly
- Trust recovering gradually toward the neutral baseline

---

## Optional External Intelligence

SYNAPSE GRID includes an optional URLhaus abuse.ch enrichment endpoint. The system works fully offline without it. To enable live samples:

```powershell
$env:URLHAUS_AUTH_KEY="your-auth-key"
npm start
```

This API is not used for routing decisions. It only enriches the academic demo with real threat-intelligence context while preserving decentralized local decision-making.

---

## Academic Documents

| File | Contents |
|---|---|
| `docs/PROJECT_REPORT.md` | Complete academic report |
| `docs/EVALUATION_RESULTS.md` | Scenario comparison and results table |
| `docs/INTELLIGENCE_JUSTIFICATION.md` | Why the system qualifies as adaptive and intelligent |
| `docs/LIMITATIONS_AND_FUTURE_WORK.md` | Constraints, trade-offs, and possible extensions |
| `docs/DEMO_NARRATIVE.md` | Step-by-step scenario explanation for demonstration |
| `docs/DEMO_SCRIPT.md` | Spoken demo script |
| `docs/DIAGRAMS.md` | Mermaid architecture and flow diagrams |
| `docs/VIVA_QA.md` | Viva questions and answers |
| `docs/STEP_BY_STEP_WORKING.md` | Detailed walkthrough of system internals |
| `docs/TEST_CASES.md` | Test case descriptions and expected outcomes |

---

## Team Split

Person 1: Core Intelligence

- `src/core/node-agent.js`
- `src/core/trust-manager.js`
- `src/core/router.js`
- `src/core/anomaly-detector.js`
- `src/core/signal-manager.js`
- `src/core/temporal-memory.js`
- `src/core/behavior-profiles.js`

Person 2: System Interface and Visualization

- `src/server/index.js`
- `src/server/simulation.js`
- `src/server/network.js`
- `src/server/topology.js`
- `src/server/metrics.js`
- `src/server/external-intelligence.js`
- `src/public/index.html`
- `src/public/styles.css`
- `src/public/app.js`
- `src/core/event-bus.js`
- `src/core/message.js`
- `src/core/constants.js`

Both team members are expected to understand the full system. This split defines implementation ownership.

---

## Academic Note

The global behavior of SYNAPSE GRID is emergent. No rule explicitly says to block or isolate a bad node. Isolation appears because trust decreases after anomalies, route scores shift away from penalized nodes, anomaly signals propagate and reduce scores further, and each node independently updates its local knowledge. The system adapts without coordination.

---

## Contributors

- [jsheiknifla](https://github.com/jsheiknifla)

---

## License

MIT
