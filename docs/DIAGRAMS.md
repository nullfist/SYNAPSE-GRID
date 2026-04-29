# Diagrams

Paste these Mermaid diagrams into any Mermaid renderer, GitHub Markdown preview, or documentation tool that supports Mermaid.

## System Architecture Diagram

```mermaid
flowchart TB
  UI[Browser Visualization UI]
  WS[WebSocket Channel]
  SIM[Simulation Server]
  NET[Distributed Network Environment]

  subgraph NodeA[Node Agent]
    TM[Trust Manager]
    TMEM[Temporal Memory]
    RT[Router]
    AD[Anomaly Detector]
    SM[Signal Manager]
    BP[Behavior Profile]
    EH[Event Handler]
  end

  UI <--> WS
  WS <--> SIM
  SIM --> NET
  NET <--> NodeA
  EH --> TM
  TM --> TMEM
  EH --> RT
  EH --> AD
  EH --> SM
  EH --> BP
```

## Data Flow Diagram

```mermaid
sequenceDiagram
  participant A as Node A
  participant B as Node B
  participant D as Node D
  participant H as Node H

  A->>A: Create DATA_PACKET
  A->>A: Score neighbors using trust + success_rate - risk
  A->>A: Apply load, latency, and trend penalties
  A->>B: Forward packet
  B->>B: Inspect anomaly and update trust
  B->>D: Forward packet
  D->>D: Score neighbors independently
  D->>H: Forward packet
  H->>H: Destination reached
```

## Node Interaction Diagram

```mermaid
flowchart LR
  A((A)) --- B((B))
  A --- C((C))
  B --- D((D))
  B --- E((E))
  C --- D
  C --- F((F))
  D --- E
  D --- G((G))
  E --- H((H))
  F --- G
  G --- H
```

## Trust and Signal Feedback Loop

```mermaid
flowchart TD
  M[Incoming Message] --> I[Inspect Message]
  I -->|Normal| R[Reward Sender Trust]
  I -->|Anomalous| P[Penalize Sender Trust]
  P --> S[Broadcast Anomaly Signal]
  S --> D[Signal Decays Per Hop]
  D --> Q[Neighbor Updates Risk]
  Q --> X[Routing Score Changes]
  R --> X
  X --> Y[Next Hop Selected Locally]
```

## Experiment and Metrics Diagram

```mermaid
flowchart LR
  SC[Scenario Runner] --> ENV[Network Environment]
  ENV --> N1[Local Node Decisions]
  N1 --> OBS[Observed Routes and Signals]
  OBS --> MET[Metrics Collector]
  MET --> UI[Dashboard Graphs]
  SC -.does not choose routes.-> N1
```
