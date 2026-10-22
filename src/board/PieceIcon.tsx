import { createElement, type ComponentProps } from 'react'
import type { Piece } from '@/core'
import { DEFAULT_PIECE_THEME, type PieceThemeId } from './themes'
import './styles/board.css'

export interface PieceIconProps extends ComponentProps<'span'> {
  piece: Piece
  pieceTheme?: PieceThemeId
}

/**
 * A single piece drawn with the active piece theme, for palettes and pickers.
 * Decorative: give the surrounding control an accessible name. It fills its
 * parent, so size it with the parent (or a `size-*` class).
 */
export function PieceIcon({
  piece,
  pieceTheme = DEFAULT_PIECE_THEME,
  className,
  ...props
}: PieceIconProps) {
  return (
    <span
      data-slot="piece-icon"
      data-piece-theme={pieceTheme}
      aria-hidden="true"
      className={`piece-icon ${className ?? ''}`.trim()}
      {...props}
    >
      {createElement('piece', { className: `${piece.role} ${piece.color}` })}
    </span>
  )
}
