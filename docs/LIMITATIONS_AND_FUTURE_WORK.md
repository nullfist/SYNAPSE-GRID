# Limitations and Future Work

## Limitations

### Scalability

The current prototype runs as an in-process simulation. It demonstrates distributed logic, but it does not yet launch each node as a separate physical or cloud process. Large-scale deployment would require process orchestration, persistent storage, and stronger network fault handling.

### Convergence

The system adapts over time, but convergence is not mathematically guaranteed for every topology. Exploration, signal decay, unstable nodes, and randomized topology can keep the network in a changing state.

### Dependency Assumptions

The prototype assumes nodes can identify their direct neighbors and exchange messages reliably enough to observe success or failure. In a real network, authentication, message signing, replay protection, and clock drift handling would be required.

### Security Trade-Offs

The anomaly detector is intentionally rule-based and explainable. It can detect abnormal frequency, invalid payloads, and inconsistent patterns, but sophisticated adversaries could mimic normal behavior.

### Simulation Trade-Offs

Latency, load, and packet drops are simulated. This is appropriate for academic demonstration, but real deployment would need actual measurements from sockets, queues, and host resources.

### External Intelligence Trade-Offs

The optional URLhaus integration is used only as external context for demonstration. It is not a central controller and does not decide routes. Live use depends on fair-use limits and an auth key from abuse.ch.

## Future Work

- Run each node as a separate process or container.
- Add cryptographic message signing to prevent identity spoofing.
- Persist trust history in a lightweight database.
- Add larger topology generation and stress testing.
- Compare against fixed shortest-path routing and centralized controller baselines.
- Add formal convergence and stability analysis.
- Integrate real network measurements for latency and queue load.
- Add optional ML-based anomaly scoring as a future extension while preserving the current rule-based baseline.
- Deploy across multiple machines or cloud instances.
- Add Byzantine fault experiments with colluding malicious nodes.
