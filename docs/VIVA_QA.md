# Viva Questions and Answers

## Basic

**Q1. What is SYNAPSE GRID?**

SYNAPSE GRID is a decentralized rule-based distributed system where independent nodes route messages, update trust, detect anomalies, and adapt to failures without a central controller.

**Q2. Is this an AI or ML project?**

No. It does not use machine learning, neural networks, or training. It uses transparent rules for trust, routing, anomaly detection, and signal propagation.

**Q3. What is a node in this project?**

A node is an autonomous agent with a unique ID, neighbor list, local trust table, interaction history, anomaly detector, and routing logic.

**Q4. What communication method is used?**

The demo uses WebSockets for live communication between the backend simulation and browser visualization. Internally, messages are event-driven.

**Q5. What are the main event types?**

`DATA_PACKET`, `ANOMALY_SIGNAL`, `NODE_FAILURE`, and `TRUST_UPDATE`.

## Intermediate

**Q6. How does routing work without fixed routes?**

Each node calculates a score for its available neighbors using trust, success rate, and risk. It forwards to the best local candidate, with some randomness for exploration.

**Q7. How is trust updated?**

Trust increases after successful interactions and decreases after failures or anomalous messages. It also decays toward a neutral baseline over time.

**Q8. How does the system detect anomalies?**

It checks abnormal frequency, invalid message structure, invalid data, and inconsistent origin patterns.

**Q9. What happens when a node fails?**

Messages to the failed node fail. Neighboring nodes penalize it and spread a failure notice. Future route scores become lower for that node, so traffic reroutes.

**Q10. What is signal decay?**

An anomaly signal loses strength as it travels through the network. This prevents distant nodes from overreacting to weak or old information.

## Advanced

**Q11. Why is there no central controller?**

Central controllers create a single point of failure and reduce autonomy. In SYNAPSE GRID, every node makes decisions using local observations, which is closer to decentralized distributed systems.

**Q12. How does emergence happen?**

Emergence happens when many local decisions combine into global behavior. No node is directly ordered to isolate another node. Avoidance emerges because trust decreases, risk increases, and route scores change.

**Q13. Why include randomness in routing?**

Random exploration prevents the system from permanently using one route and allows recovered or underused nodes to prove reliability.

**Q14. Can a malicious node recover?**

Yes. The system allows recovery because trust can gradually return toward neutral and improve through successful interactions.

**Q15. How is this different from hardcoded blocking?**

Hardcoded blocking would directly prevent traffic to a bad node. SYNAPSE GRID only changes trust and risk values. If a node becomes reliable again, it can re-enter routes naturally.

**Q16. What are the limitations?**

The prototype uses a simulated topology and simple rule-based anomaly checks. A production system would need stronger authentication, persistence, rate limiting, and real network deployment.

**Q17. How can this project be extended?**

Possible extensions include persistent logs, cryptographic message signing, larger dynamic topologies, weighted edges, Byzantine fault experiments, and process-per-node deployment.

**Q18. What makes the trust model advanced?**

It combines reliability, latency, anomaly frequency, signal influence, and temporal trend instead of using a single success or failure counter.

**Q19. How does load-aware routing work?**

Each node observes neighbor load from recent interactions. Overloaded nodes receive a route-score penalty, so traffic naturally shifts to less loaded neighbors.

**Q20. Does experiment mode violate decentralization?**

No. Experiment mode only creates repeatable scenarios and collects observations. It does not choose routes or override node decisions.

**Q21. Why is temporal learning not machine learning?**

Temporal learning here means rule-based historical memory. The node compares recent behavior with older behavior using simple counters and trends. No training, prediction model, or neural network is used.
