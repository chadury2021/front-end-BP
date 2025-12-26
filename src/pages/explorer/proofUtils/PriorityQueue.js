export class PriorityQueue {
  constructor() {
    this.values = [];
  }

  enqueue(element, priority) {
    this.values.push({ element, priority });
    this.sort();
  }

  dequeue() {
    return this.values.shift()?.element;
  }

  sort() {
    this.values.sort((a, b) => b.priority - a.priority);
  }

  get length() {
    return this.values.length;
  }
}
