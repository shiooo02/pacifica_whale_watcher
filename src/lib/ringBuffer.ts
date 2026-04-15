export class RingBuffer<T> {
  private buffer: T[];
  private head = 0;
  private count = 0;
  private readonly capacity: number;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.buffer = new Array(capacity);
  }

  push(item: T): void {
    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this.capacity;
    if (this.count < this.capacity) this.count++;
  }

  toArray(): T[] {
    if (this.count < this.capacity) {
      return this.buffer.slice(0, this.count);
    }
    return [...this.buffer.slice(this.head), ...this.buffer.slice(0, this.head)];
  }

  get length(): number {
    return this.count;
  }

  last(n: number): T[] {
    const arr = this.toArray();
    return arr.slice(Math.max(0, arr.length - n));
  }

  average(fn: (item: T) => number): number {
    if (this.count === 0) return 0;
    const arr = this.toArray();
    return arr.reduce((sum, item) => sum + fn(item), 0) / arr.length;
  }
}
