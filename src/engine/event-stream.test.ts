import { EventStream } from './event-stream'

async function collect<T>(stream: AsyncIterable<T>): Promise<T[]> {
  const items: T[] = []
  for await (const item of stream) items.push(item)
  return items
}

describe('EventStream', () => {
  it('delivers values pushed before and after the consumer starts, in order', async () => {
    const stream = new EventStream<number>()
    stream.push(1)
    const done = collect(stream)
    stream.push(2)
    stream.push(3)
    stream.close()
    expect(await done).toEqual([1, 2, 3])
  })

  it('delivers buffered values after close, then ends', async () => {
    const stream = new EventStream<string>()
    stream.push('a')
    stream.close()
    expect(await collect(stream)).toEqual(['a'])
  })

  it('wakes a waiting consumer on close', async () => {
    const stream = new EventStream<number>()
    const done = collect(stream)
    stream.close()
    expect(await done).toEqual([])
  })

  it('ignores pushes after close', async () => {
    const stream = new EventStream<number>()
    stream.close()
    stream.push(1)
    expect(await collect(stream)).toEqual([])
  })

  it('stops and drops the buffer when the consumer breaks out early', async () => {
    const stream = new EventStream<number>()
    stream.push(1)
    stream.push(2)
    for await (const value of stream) {
      expect(value).toBe(1)
      break
    }
    stream.push(3)
    expect(await collect(stream)).toEqual([])
  })
})
