export class EventBus {
  constructor() {
    this.handlers = new Map();
  }

  on(type, handler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type).add(handler);
    return () => this.handlers.get(type)?.delete(handler);
  }

  emit(type, event) {
    const listeners = this.handlers.get(type) || new Set();
    for (const handler of listeners) {
      handler(event);
    }
  }
}
