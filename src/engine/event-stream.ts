/** Push-based async iterable with a single consumer. Pushes after `close` are ignored. */
export class EventStream<T> implements AsyncIterable<T> {
  private readonly buffer: T[] = []
  private waiting: ((result: IteratorResult<T>) => void) | undefined
  private closed = false

  push(value: T): void {
    if (this.closed) return
    if (this.waiting) {
      const resolve = this.waiting
      this.waiting = undefined
      resolve({ value, done: false })
    } else {
      this.buffer.push(value)
    }
  }

  /** Ends the stream; buffered values are still delivered first. */
  close(): void {
    if (this.closed) return
    this.closed = true
    if (this.waiting) {
      const resolve = this.waiting
      this.waiting = undefined
      resolve({ value: undefined, done: true })
    }
  }

  [Symbol.asyncIterator](): AsyncIterator<T> {
    return {
      next: () => {
        const value = this.buffer.shift()
        if (value !== undefined) return Promise.resolve({ value, done: false })
        if (this.closed) return Promise.resolve({ value: undefined, done: true })
        return new Promise((resolve) => {
          this.waiting = resolve
        })
      },
      return: () => {
        this.buffer.length = 0
        this.close()
        return Promise.resolve({ value: undefined, done: true })
      },
    }
  }
}
