import { formatCommand, type UciCommand } from './commands'
import type { UciMessage, UciOption } from './messages'
import { parseLine } from './parse'

/** Line-based connection to an engine process (a Web Worker, a Node engine, a test double…). */
export interface UciTransport {
  send(line: string): void
  onLine(listener: (line: string) => void): () => void
  onError(listener: (error: Error) => void): () => void
  terminate(): void
}

export interface UciIdentity {
  readonly name?: string
  readonly author?: string
  readonly options: ReadonlyMap<string, UciOption>
}

export interface UciClientOptions {
  /** How long to wait for `uciok` / `readyok` before giving up. */
  readonly timeoutMs?: number
}

const DEFAULT_TIMEOUT_MS = 60_000

/** Typed UCI protocol on top of a transport: parses output, serialises commands, awaits handshakes. */
export class UciClient {
  private readonly listeners = new Set<(message: UciMessage) => void>()
  private readonly offLine: () => void
  private readonly transport: UciTransport
  private readonly timeoutMs: number
  private closed = false

  constructor(transport: UciTransport, options: UciClientOptions = {}) {
    this.transport = transport
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
    this.offLine = transport.onLine((chunk) => {
      for (const line of chunk.split(/\r?\n/)) {
        if (line.trim() === '') continue
        const message = parseLine(line)
        for (const listener of [...this.listeners]) listener(message)
      }
    })
  }

  onMessage(listener: (message: UciMessage) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  onError(listener: (error: Error) => void): () => void {
    return this.transport.onError(listener)
  }

  send(command: UciCommand): void {
    if (this.closed) return
    this.transport.send(formatCommand(command))
  }

  /** Sends `uci` and collects the engine's identity and options up to `uciok`. */
  async handshake(): Promise<UciIdentity> {
    let name: string | undefined
    let author: string | undefined
    const options = new Map<string, UciOption>()
    const done = this.waitFor((message) => {
      if (message.type === 'id') {
        if (message.field === 'name') name = message.value
        else author = message.value
      } else if (message.type === 'option') {
        options.set(message.option.name, message.option)
      }
      return message.type === 'uciok'
    }, 'uciok')
    this.send({ type: 'uci' })
    await done
    return { ...(name && { name }), ...(author && { author }), options }
  }

  /** Resolves once the engine has processed everything sent so far (`isready` → `readyok`). */
  async ready(): Promise<void> {
    const done = this.waitFor((message) => message.type === 'readyok', 'readyok')
    this.send({ type: 'isready' })
    await done
  }

  /** Asks the engine to quit and releases the transport. Safe to call twice. */
  close(): void {
    if (this.closed) return
    try {
      this.send({ type: 'quit' })
    } catch {
      // The transport may already be dead; terminating below is what matters.
    }
    this.closed = true
    this.offLine()
    this.listeners.clear()
    this.transport.terminate()
  }

  private waitFor(match: (message: UciMessage) => boolean, what: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const cleanup = () => {
        clearTimeout(timer)
        off()
        offError()
      }
      const timer = setTimeout(() => {
        cleanup()
        reject(new Error(`Engine did not answer with ${what} within ${this.timeoutMs} ms`))
      }, this.timeoutMs)
      const off = this.onMessage((message) => {
        if (match(message)) {
          cleanup()
          resolve()
        }
      })
      const offError = this.transport.onError((error) => {
        cleanup()
        reject(error)
      })
    })
  }
}
