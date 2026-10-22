import type { Piece, PromotionRole, Square } from '@/core'
import { en } from './locales/en'
import { ptBR } from './locales/pt-BR'

/**
 * The board is a layer below i18n, so it never imports it: strings arrive
 * through this context. The app binds it to i18next (namespace "board", see
 * `boardTranslations`); without a provider the English bundle is used.
 */
export interface BoardMessages {
  label: string
  hint: string
  pieceName(piece: Piece): string
  squareEmpty(square: Square): string
  squareOccupied(square: Square, piece: Piece): string
  selected(square: Square, moves: number): string
  deselected: string
  moved(piece: Piece, from: Square, to: Square): string
  placed(piece: Piece, square: Square): string
  removed(square: Square): string
  promotionTitle: string
  promotionCancel: string
  promotionChoice(role: PromotionRole, color: Piece['color']): string
}

/** Resource bundles for i18next's "board" namespace. */
export const boardTranslations = { en, 'pt-BR': ptBR } as const
export const BOARD_NAMESPACE = 'board'

export type Translate = (key: string, vars?: Record<string, string | number>) => string

/** Builds messages from any translate function (i18next's `t` for the "board" namespace). */
export function createBoardMessages(t: Translate): BoardMessages {
  const pieceName = (piece: Piece) => t(`pieces.${piece.color}.${piece.role}`)
  return {
    label: t('label'),
    hint: t('hint'),
    pieceName,
    squareEmpty: (square) => t('squareEmpty', { square }),
    squareOccupied: (square, piece) => t('squareOccupied', { square, piece: pieceName(piece) }),
    selected: (square, moves) => t('selected', { square, count: moves }),
    deselected: t('deselected'),
    moved: (piece, from, to) => t('moved', { piece: pieceName(piece), from, to }),
    placed: (piece, square) => t('placed', { piece: pieceName(piece), square }),
    removed: (square) => t('removed', { square }),
    promotionTitle: t('promotion.title'),
    promotionCancel: t('promotion.cancel'),
    promotionChoice: (role, color) => pieceName({ role, color }),
  }
}

/** Minimal English translator over the bundled bundle: `{{vars}}` and `_one`/`_other` plurals. */
const translateEnglish: Translate = (key, vars) => {
  const lookup = (path: string): unknown =>
    path.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown>)?.[part], en)
  const plural = vars?.count === undefined ? '' : vars.count === 1 ? '_one' : '_other'
  const template = lookup(key + plural) ?? lookup(key)
  const text = typeof template === 'string' ? template : key
  return text.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => String(vars?.[name] ?? ''))
}

export const DEFAULT_MESSAGES: BoardMessages = createBoardMessages(translateEnglish)
