# Step-by-Step Working

## 1. Network Initialization

The simulation creates eight nodes: `A` through `H`. Each node receives only its own neighbor list. No node receives a complete global route table.

## 2. Trust Initialization

Every node initializes trust for its direct neighbors at a neutral value. Trust is local, so node `A` may trust `B` differently from how `B` trusts `A`.

Trust later becomes a weighted score made from reliability, latency, anomaly frequency, signal influence, and historical trend.

## 3. Normal Data Packet Flow

When a packet is sent from `A` to `H`, node `A` scores its available neighbors. It forwards the packet to the best local next hop. The next node repeats the same process independently until the destination is reached.

The route log explains why a neighbor was selected, including trust, success rate, risk, load penalty, latency penalty, and trend score.

## 4. Trust Update

If forwarding succeeds, the chosen neighbor is rewarded. If forwarding fails, the neighbor is penalized. This gradually shifts traffic toward reliable paths.

## 5. Malicious Behavior

When a node is toggled malicious, it may generate invalid data or inconsistent origin patterns. Other nodes detect those anomalies through rule-based checks.

## 6. Signal Propagation

An anomaly creates an `ANOMALY_SIGNAL`. Neighboring nodes receive it, reduce its strength, store it as local risk, and may forward it further if it is still strong enough.

## 7. Failure Handling

When a node fails, messages sent to it cannot be delivered. Neighboring nodes reduce trust and spread a failure notice. Later routes naturally avoid that node because it has a worse score.

## 8. Recovery

A failed node can return. It does not instantly regain full influence. Trust recovers gradually through decay and successful future interactions.

## 9. Emergence

The system never centrally commands a route or block. Adaptive global behavior appears from local scoring, trust updates, anomaly signals, and neighbor decisions.

## 10. Experiment Mode

Experiment mode resets the simulation into a scenario and sends multiple packets. It compares success rate, latency, reliability, and trust before and after the run.

## 11. Dynamic Topology

The topology can be rebuilt as a mesh, ring, or random connected graph. Nodes only learn their direct neighbors after the topology changes.
