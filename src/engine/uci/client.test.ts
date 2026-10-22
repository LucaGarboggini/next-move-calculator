import { FakeTransport } from '../testing/fake-transport'
import { UciClient } from './client'
import type { UciMessage } from './messages'

describe('UciClient', () => {
  it('performs the uci handshake and collects identity and options', async () => {
    const transport = new FakeTransport()
    const client = new UciClient(transport)
    const identity = await client.handshake()
    expect(transport.sent).toEqual(['uci'])
    expect(identity.name).toBe('Fake 1')
    expect(identity.options.get('Hash')).toMatchObject({ type: 'spin', max: 1024 })
  })

  it('waits for readyok', async () => {
    const transport = new FakeTransport(false)
    const client = new UciClient(transport)
    let resolved = false
    const ready = client.ready().then(() => (resolved = true))
    await Promise.resolve()
    expect(transport.sent).toEqual(['isready'])
    expect(resolved).toBe(false)
    transport.emit('readyok')
    await ready
    expect(resolved).toBe(true)
  })

  it('parses output and splits multi-line chunks', () => {
    const transport = new FakeTransport(false)
    const client = new UciClient(transport)
    const seen: UciMessage[] = []
    client.onMessage((m) => seen.push(m))
    transport.emit('readyok\r\n\ninfo depth 1 score cp 5 pv e2e4\nbestmove e2e4')
    expect(seen.map((m) => m.type)).toEqual(['readyok', 'info', 'bestmove'])
  })

  it('serialises typed commands', () => {
    const transport = new FakeTransport()
    const client = new UciClient(transport)
    client.send({ type: 'position', fen: '8/8/8/8/8/8/8/K6k w - - 0 1' })
    client.send({ type: 'go', limits: { depth: 5 } })
    client.send({ type: 'stop' })
    expect(transport.sent).toEqual([
      'position fen 8/8/8/8/8/8/8/K6k w - - 0 1',
      'go depth 5',
      'stop',
    ])
  })

  it('rejects a handshake that times out', async () => {
    const client = new UciClient(new FakeTransport(false), { timeoutMs: 10 })
    await expect(client.handshake()).rejects.toThrow(/uciok/)
  })

  it('rejects a pending handshake when the transport fails', async () => {
    const transport = new FakeTransport(false)
    const client = new UciClient(transport)
    const handshake = client.handshake()
    transport.crash('worker died')
    await expect(handshake).rejects.toThrow('worker died')
  })

  it('close sends quit, terminates, and ignores later traffic and sends', () => {
    const transport = new FakeTransport(false)
    const client = new UciClient(transport)
    const seen: UciMessage[] = []
    client.onMessage((m) => seen.push(m))
    client.close()
    client.close()
    client.send({ type: 'isready' })
    transport.emit('readyok')
    expect(transport.sent).toEqual(['quit'])
    expect(transport.terminated).toBe(true)
    expect(seen).toEqual([])
  })
})
