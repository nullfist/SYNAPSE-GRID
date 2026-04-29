export function createMessage({ type, payload, senderId, trustWeight = 1, pathHistory = [] }) {
  return {
    type,
    payload,
    sender_id: senderId,
    trust_weight: Number(trustWeight.toFixed(4)),
    path_history: [...pathHistory],
    timestamp: Date.now()
  };
}
