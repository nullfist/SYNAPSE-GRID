# Test Cases

## Test Case 1: Normal Data Flow

**Input:** Send data from `A` to `H`.

**Expected Result:** Packet reaches `H` through a dynamically selected path. Trust increases on successful links.

## Test Case 2: Node Failure

**Input:** Fail node `D`, then send data from `A` to `H`.

**Expected Result:** Packets avoid `D` and reroute through alternate paths such as `A -> B -> E -> H` or `A -> C -> F -> G -> H`.

## Test Case 3: Malicious Node

**Input:** Toggle node `B` as malicious, then send or burst packets from `B`.

**Expected Result:** Neighboring nodes detect invalid data or inconsistent origin patterns. Trust in `B` drops and anomaly signals propagate.

## Test Case 4: Recovery Behavior

**Input:** Fail node `D`, recover it, then allow ticks and successful interactions.

**Expected Result:** `D` becomes active again. Its trust gradually recovers rather than instantly returning to full reliability.

## Test Case 5: Signal Decay

**Input:** Trigger anomaly from a malicious node.

**Expected Result:** Signal strength is strongest near the source and decreases with distance.

## Test Case 6: No Hardcoded Blocking

**Input:** Make a node malicious and observe routing.

**Expected Result:** Traffic avoidance emerges from low trust and high risk. The system does not execute a direct hardcoded block rule.

## Test Case 7: Slow Node Latency

**Input:** Set a node behavior to `slow` and route packets through the network.

**Expected Result:** Observed latency increases and the weighted trust model gradually reduces preference for that node.

## Test Case 8: Experiment Mode

**Input:** Run `normal`, `attack`, `failure`, and `stress` scenarios.

**Expected Result:** The metrics panel stores comparable summaries for each scenario.

## Test Case 9: Dynamic Topology

**Input:** Change topology mode from mesh to ring or random.

**Expected Result:** Neighbor lists change, but routing remains local and decentralized.

## Test Case 10: Explainability Logs

**Input:** Send a data packet.

**Expected Result:** The event log shows why each routing decision was made, including candidate scores.
