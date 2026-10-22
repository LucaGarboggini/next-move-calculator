import { Position } from '@/core'
import type { UciTransport } from '../uci/client'

/** Scriptable engine process for tests: records what was sent, emits whatever the test says. */
export class FakeTransport implements UciTransport {
  readonly sent: string[] = []
  terminated = false
  private readonly autoReply: boolean
  private readonly lineListeners = new Set<(line: string) => void>()
  private readonly errorListeners = new Set<(error: Error) => void>()

  /** `autoReply`: answer `uci` with `uciok` and `isready` with `readyok`, like a healthy engine. */
  constructor(autoReply = true) {
    this.autoReply = autoReply
  }

  send(line: string): void {
    this.sent.push(line)
    if (!this.autoReply) return
    if (line === 'uci') {
      this.emit('id name Fake 1')
      this.emit('option name Hash type spin default 16 min 1 max 1024')
      this.emit('uciok')
    } else if (line === 'isready') {
      this.emit('readyok')
    }
  }

  onLine(listener: (line: string) => void): () => void {
    this.lineListeners.add(listener)
    return () => this.lineListeners.delete(listener)
  }

  onError(listener: (error: Error) => void): () => void {
    this.errorListeners.add(listener)
    return () => this.errorListeners.delete(listener)
  }

  terminate(): void {
    this.terminated = true
  }

  emit(...lines: string[]): void {
    for (const line of lines) for (const listener of [...this.lineListeners]) listener(line)
  }

  crash(message = 'engine crashed'): void {
    for (const listener of [...this.errorListeners]) listener(new Error(message))
  }

  /** Lines sent that start with `prefix`. */
  sentMatching(prefix: string): string[] {
    return this.sent.filter((line) => line.startsWith(prefix))
  }
}

/** Parses a FEN that the test knows is valid. */
export function position(fen?: string): Position {
  if (!fen) return Position.start()
  const result = Position.fromFen(fen)
  if (!result.ok) throw new Error(`Invalid test FEN: ${fen}`)
  return result.value
}

/** Resolves after pending promise callbacks have run. */
export const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0))
