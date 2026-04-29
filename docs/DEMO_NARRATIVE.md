# Demo Narrative

Use this narrative while presenting the dashboard.

## Scenario 1: Normal Operation

1. The network starts with all nodes active and normal.
2. A packet is sent from `A` to `H`.
3. Node `A` scores its neighbors using trust, success rate, risk, latency, load, and trend.
4. The chosen next hop forwards the packet using the same local method.
5. The dashboard highlights the route and updates success metrics.
6. Trust rises slightly on successful links.

Key explanation:

> No global route table is used. Every hop is selected locally.

## Scenario 2: Attack

1. A node is changed to malicious behavior.
2. The malicious node emits invalid or inconsistent packet data.
3. Neighboring nodes detect anomalies using rule-based checks.
4. Trust decreases locally for the suspicious node.
5. Anomaly signals spread to neighboring nodes and decay with distance.
6. Future routing decisions become less likely to choose the suspicious node.

Key explanation:

> The node is not centrally blocked. It becomes less useful because local trust and signal risk change.

## Scenario 3: Node Failure

1. A node is manually failed.
2. Packets attempting to use that node fail.
3. Neighboring nodes penalize the failed node and broadcast failure notices.
4. The routing score of the failed path drops.
5. Traffic shifts to alternate paths.
6. Success rate may dip first and then recover.

Key explanation:

> Self-healing appears as a result of repeated local rerouting.

## Scenario 4: Stress

1. Slow and unstable behaviors are introduced.
2. Slow nodes increase latency.
3. Unstable nodes drop packets and accumulate load.
4. Load-aware routing penalizes overloaded neighbors.
5. The network redistributes traffic.
6. Graphs show latency pressure and trust changes.

Key explanation:

> The system adapts not only to attacks, but also to performance degradation.

## Scenario 5: Recovery

1. A failed or unreliable node is returned to normal.
2. It does not instantly regain maximum trust.
3. Successful interactions gradually improve its local reputation.
4. Exploration allows the system to test recovered paths.

Key explanation:

> Recovery is allowed, but it must be earned through future behavior.
