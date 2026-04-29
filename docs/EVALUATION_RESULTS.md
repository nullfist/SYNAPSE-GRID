# Evaluation Results

The following table summarizes expected evaluation behavior from the built-in experiment mode. Values are representative for the prototype and may vary slightly because routing includes exploration and randomized topology can change available paths.

| Scenario | Expected Success Rate | Expected Latency | Trust Stability | Interpretation |
|---|---:|---:|---:|---|
| Normal | 90-100% | Low to moderate | High | Reliable nodes dominate routes and trust remains stable. |
| Attack | 60-85% initially, then improves | Moderate | Medium | Malicious behavior creates anomaly signals; trust shifts away from risky nodes. |
| Failure | 65-90% initially, then improves | Moderate to high during reroute | Medium | Failed paths cause short disruption, then adaptive rerouting improves delivery. |
| Stress | 55-85% | High | Low to medium | Slow and unstable nodes increase latency and load, forcing route redistribution. |

## Metrics Used

- **Success rate**: delivered packets divided by total attempted packets.
- **Latency**: simulated end-to-end route delay based on behavior profile and load.
- **Trust stability**: how much average trust changes during the scenario.
- **Reliability**: successful node interactions divided by total received interactions.
- **Load**: local pressure on a node from received and forwarded messages.

## Reading the Dashboard

- Green success graph rising means packet delivery is improving.
- Blue trust graph becoming smoother means the network is converging toward stable neighbor preferences.
- Yellow reliability/latency trend shows whether the network is paying more cost to maintain delivery.
- Red dashed signal animations show anomaly information moving through the graph with decay.

## Academic Result Summary

The most important result is not a fixed numerical score. The result is that the network changes behavior after disruption without centralized route control. During attack and failure scenarios, trust and signal feedback reduce the probability of choosing unreliable paths. During stress scenarios, load and latency penalties spread traffic away from overloaded or slow nodes.

Across all scenarios, the system demonstrates adaptive recovery, where performance metrics initially degrade under disruption but improve as local trust and routing decisions adjust.
