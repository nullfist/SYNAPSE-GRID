# SYNAPSE GRID: A Self-Adaptive Distributed Multi-Agent System

## Abstract

SYNAPSE GRID is a decentralized, rule-based distributed system in which independent nodes communicate, route packets, detect abnormal behavior, and adapt to failures without a central authority. Each node maintains local trust scores, interaction history, anomaly signals, and routing preferences. Global behavior emerges from local decisions: unreliable or malicious nodes gradually lose influence, failed nodes are avoided, and traffic reroutes through healthier paths. The project demonstrates adaptive distributed intelligence without using machine learning, neural networks, or hardcoded blocking rules.

## Problem Statement

Modern distributed systems must continue operating when nodes fail, misbehave, or become unreliable. Traditional centralized monitoring can create a single point of failure and may not scale well for dynamic environments. The problem is to design a decentralized system where each node independently decides how to route and react using only local knowledge and messages received from neighbors.

The project solves this by building a multi-agent network where:

- Every node has a unique identity.
- Every node maintains local neighbor trust.
- Communication is event-driven.
- Routing adapts dynamically.
- Anomalies are detected using rules.
- Failure and risk signals propagate with decay.
- No central controller decides routes or blocks nodes.

## Objectives

- Implement autonomous nodes that maintain local state.
- Use WebSockets to visualize distributed behavior in real time.
- Demonstrate normal routing, node failure, malicious activity, rerouting, trust updates, and signal propagation.
- Preserve academic clarity by separating intelligence, communication, and visualization layers.
- Show emergent behavior through local trust and routing changes.

## System Architecture

The system contains three main layers:

- **Node Intelligence Layer**: trust management, anomaly detection, signal handling, routing, and recovery.
- **Simulation and Communication Layer**: manages demo topology, WebSocket state broadcasting, and UI commands.
- **Visualization Layer**: browser dashboard showing nodes, links, trust, route activity, and anomaly signals.

Although the simulation server hosts the demo, it does not centrally choose routes. Each `NodeAgent` independently chooses the next hop using its own trust table, success history, signal risk, and exploration behavior.

## Node Model

Each node stores:

- Unique node ID
- Neighbor list
- Trust score per neighbor
- Interaction history per neighbor
- Local anomaly memory
- Local risk signals
- Packet metrics

The node supports four major event types:

- `DATA_PACKET`
- `ANOMALY_SIGNAL`
- `NODE_FAILURE`
- `TRUST_UPDATE`

## Message Structure

```json
{
  "type": "DATA_PACKET",
  "payload": {
    "origin": "A",
    "destination": "H",
    "content": "adaptive packet",
    "integrity": true
  },
  "sender_id": "A",
  "trust_weight": 1,
  "path_history": ["A"],
  "timestamp": 1777400000000
}
```

## Methodology

### Trust System

Trust starts at a neutral value. A successful interaction increases trust. Failed forwarding or anomalous behavior decreases trust. Over time, trust decays toward the neutral baseline so a node can recover from old mistakes. Failed nodes can rejoin, but they must rebuild trust gradually.

Each node continuously follows a loop of receiving data, evaluating neighbors, updating trust, detecting anomalies, and selecting the next route, forming a distributed decision cycle.

The advanced trust model uses weighted factors:

- Reliability: successful interactions compared with failed or anomalous interactions
- Latency: whether a neighbor responds within the expected latency budget
- Anomaly frequency: how often a neighbor is involved in invalid or inconsistent messages
- Signal influence: risk learned from propagated anomaly and failure signals
- Temporal trend: whether recent behavior is improving or degrading compared with older behavior

This remains rule-based. No model is trained, and no statistical classifier is used.

### Routing

Routes are never fixed. Each node scores available neighbors:

```text
score = trust + success_rate - risk
```

The upgraded route score also considers load, latency penalty, trend score, and direct destination bonus. A small exploration probability lets nodes occasionally try alternate routes, preventing the network from becoming permanently locked into one path.

The routing score is influenced by trust, success rate, risk, latency penalties, load pressure, and temporal trends, allowing multi-factor adaptive decisions.

Every route decision produces an explainability log containing the candidate scores and the local factors that caused the chosen neighbor to win.

### Node Behavior Profiles

Nodes can run with different behavior profiles:

- Normal: reliable and low latency
- Slow: valid but high latency, making it less attractive under latency-aware trust
- Malicious: frequently emits invalid or inconsistent data
- Unstable: intermittently drops traffic and accumulates load quickly

These profiles do not create hardcoded routing blocks. They influence observed local metrics, and local metrics influence trust and routing.

### Anomaly Detection

The detector checks:

- Abnormal message frequency
- Invalid message structure
- Invalid data payload
- Inconsistent sender origin patterns

When anomalies are detected, local trust decreases and an anomaly signal is broadcast to neighbors.

### Signal Propagation

Anomaly signals are propagated across neighbors. Each hop reduces signal strength. Nodes react only when signal strength is meaningful, which prevents one weak signal from instantly isolating a node.

### Self-Healing

When a node fails, attempts to route through it fail. Neighboring nodes lower trust for the failed node and broadcast failure knowledge. Future routing decisions naturally avoid that path because its score becomes worse.

### System Metrics and Experiment Mode

The system records:

- Packet success rate
- Average latency
- Average node reliability
- Average trust
- Current node load
- Trust evolution over time

Experiment mode runs repeatable scenarios: normal, attack, failure, and stress. Each scenario records before and after metrics so the system can be evaluated academically.

### Network Topology Variation

The prototype supports multiple topology modes:

- Adaptive mesh
- Ring with shortcuts
- Random connected graph

The topology affects available neighbors, but it does not introduce central route planning. Every node still makes local decisions.

## Emergent Behavior

The system does not contain a rule such as `if bad then block`. Instead, isolation emerges from the interaction of:

- Reduced trust after failed or anomalous behavior
- Increased risk from propagated anomaly signals
- Dynamic route scoring
- Success-rate memory
- Historical trend memory
- Load and latency penalties
- Continued exploration and recovery

As a result, a malicious node becomes less likely to receive traffic, while reliable nodes become preferred. This is emergent because the global pattern appears from many local decisions.

## Comparison with Traditional Systems

Traditional centralized routing or monitoring systems use one controller to calculate routes, mark nodes as failed, or block suspicious participants. This can be simpler to manage, but it creates a single point of failure and concentrates authority.

SYNAPSE GRID distributes this responsibility:

- Route choice is made by the current node only.
- Trust values are local and may differ between nodes.
- Failure and anomaly knowledge spreads through decaying signals.
- Recovery is gradual and based on future behavior.
- The UI observes and triggers experiments, but it does not decide routes.

This makes the system more aligned with decentralized distributed systems, peer-to-peer routing, and self-organizing networks.

## Results

The prototype demonstrates:

- Normal packet flow from source to destination
- Automatic route changes after node failure
- Detection of malicious invalid data and inconsistent origins
- Trust score changes visible in real time
- Anomaly signals spreading with decreasing strength
- Gradual trust recovery after node recovery
- Load-aware avoidance of stressed nodes
- Latency-aware reduction in preference for slow nodes
- Scenario-level comparison between normal, attack, failure, and stress conditions

### Results Table

| Scenario | Success Rate | Latency | Trust Stability | Main Observation |
|---|---:|---:|---:|---|
| Normal | 90-100% | Low | High | Stable trust and reliable delivery. |
| Attack | 60-85% initially, then improves | Moderate | Medium | Anomaly signals reduce use of malicious nodes. |
| Failure | 65-90% initially, then improves | Moderate to high | Medium | Failed nodes are bypassed after local penalties. |
| Stress | 55-85% | High | Low to medium | Slow and unstable nodes force traffic redistribution. |

Detailed evaluation notes are available in `docs/EVALUATION_RESULTS.md`.

Across all scenarios, the system demonstrates adaptive recovery, where performance metrics initially degrade under disruption but improve as local trust and routing decisions adjust.

## Intelligence Justification

The system is adaptive because future decisions change after observed feedback. It is intelligent in the distributed-systems sense: nodes use local memory, trust, temporal trends, load, latency, and anomaly signals to modify future behavior.

This intelligence comes from:

- Feedback loops between delivery outcomes and trust scores
- Signal propagation that spreads risk without central command
- Temporal memory that compares recent behavior with older behavior
- Decision variability caused by exploration and changing local metrics
- Emergent routing patterns caused by many independent local decisions

The system is not machine learning because no model is trained and no neural network is used.

## Limitations

- The prototype runs as an in-process simulation rather than multiple physical machines.
- Convergence is adaptive but not formally guaranteed for every topology.
- Latency, load, and packet drops are simulated for demonstration.
- Security checks are explainable rules and may not detect sophisticated adversaries.
- Real deployment would require authentication, encryption, persistence, and process orchestration.

## Future Work

- Deploy each node as a separate process, container, or cloud instance.
- Add cryptographic message signing and replay protection.
- Add persistent trust storage.
- Compare performance against centralized routing and shortest-path baselines.
- Add larger topologies and formal convergence analysis.
- Add optional ML anomaly detection as an extension while keeping this rule-based version as the explainable baseline.

## Team Contribution Plan

### Person 1: Core Intelligence

- `NodeAgent`
- `TrustManager`
- `Router`
- `SignalManager`
- `AnomalyDetector`

Person 1 explains how local rules produce adaptive behavior.

### Person 2: System Interface and Visualization

- Express and WebSocket server
- Simulation controls
- Browser canvas visualization
- Live event logs
- Demo workflow

Person 2 explains how the distributed behavior is observed and controlled for demonstration.

## Conclusion

SYNAPSE GRID proves that adaptive distributed behavior can be implemented without machine learning or central control. The system uses transparent, rule-based local intelligence to achieve routing adaptation, anomaly response, failure recovery, and emergent trust-based isolation. It is suitable for academic demonstration because every decision is explainable and every subsystem maps directly to distributed systems concepts.

This work demonstrates that decentralized systems can achieve intelligent, adaptive behavior through simple local rules, without requiring centralized control or machine learning.
