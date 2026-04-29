# Demo Script

## Preparation

1. Run `npm install`.
2. Run `npm start`.
3. Open `http://localhost:3000`.
4. Keep the browser dashboard visible during explanation.
5. Optional: set `URLHAUS_AUTH_KEY` before starting the server and click **Load URLhaus Context** for live threat-intelligence context.

## Demo 1: Normal Data Flow

1. Set source to `A`.
2. Set destination to `H`.
3. Click **Send Data Packet**.
4. Explain that each node chooses the next hop locally.
5. Point to the blue route highlight and trust bars.

## Demo 2: Node Failure and Rerouting

1. Set source to `D`.
2. Click **Fail Node**.
3. Set source to `A` and destination to `H`.
4. Click **Send Data Packet** several times.
5. Explain that routes avoid `D` because local trust and failure risk changed.

## Demo 3: Behavior Profiles

1. Set source to `D`.
2. Change behavior to `slow`.
3. Send packets and show latency increasing in the metrics panel.
4. Set source to `F`.
5. Change behavior to `unstable`.
6. Explain that unstable nodes drop traffic and become less trusted through local observations.

## Demo 4: Malicious Node Simulation

1. Set source to `B`.
2. Click **Toggle Malicious**.
3. Click **Burst Traffic**.
4. Show red dashed anomaly signal lines.
5. Select neighboring nodes and show trust reduction for `B`.

## Demo 5: Experiment Mode

1. Run **Normal**.
2. Run **Attack**.
3. Run **Failure**.
4. Run **Stress**.
5. Compare success rate, latency, reliability, and trust graphs.

## Demo 6: Dynamic Topology

1. Change topology from **Adaptive Mesh** to **Ring + Shortcuts**.
2. Send packets again.
3. Explain that only neighbor lists changed; there is still no global route controller.

## Demo 7: Recovery

1. Select failed node `D`.
2. Click **Recover Node**.
3. Send traffic through the network.
4. Explain that recovery is gradual and depends on future successful interactions.

## Demo 8: Emergent Behavior Explanation

Use this explanation:

> The system never says "block this node." Every node only updates local trust, risk, and success history. As those local values change, routing decisions shift. The global pattern of isolating unreliable nodes emerges from many local decisions.

## Closing Statement

SYNAPSE GRID demonstrates decentralized adaptation, self-healing, anomaly response, and trust-based routing without AI, machine learning, neural networks, or central control.
