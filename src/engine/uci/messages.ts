import type { Move, Score } from '@/core'

/** Fields of a UCI `info` line; all optional because engines send any subset. */
export interface UciInfo {
  readonly depth?: number
  readonly seldepth?: number
  readonly multipv?: number
  readonly score?: Score
  readonly bound?: 'lower' | 'upper'
  readonly nodes?: number
  readonly nps?: number
  readonly hashfull?: number
  readonly tbhits?: number
  readonly time?: number
  readonly currmove?: Move
  readonly currmovenumber?: number
  readonly string?: string
  readonly pv?: readonly Move[]
}

export type UciOptionType = 'check' | 'spin' | 'combo' | 'button' | 'string'

export interface UciOption {
  readonly name: string
  readonly type: UciOptionType
  readonly default?: string
  readonly min?: number
  readonly max?: number
  readonly vars?: readonly string[]
}

/** A parsed line sent by the engine. */
export type UciMessage =
  | { readonly type: 'id'; readonly field: 'name' | 'author'; readonly value: string }
  | { readonly type: 'uciok' }
  | { readonly type: 'readyok' }
  | { readonly type: 'option'; readonly option: UciOption }
  | { readonly type: 'info'; readonly info: UciInfo }
  | { readonly type: 'bestmove'; readonly move?: Move; readonly ponder?: Move }
  | { readonly type: 'unknown'; readonly line: string }
