import { useEffect, useRef, type KeyboardEvent } from 'react'
import { PROMOTION_ROLES, type Color, type PromotionRole } from '@/core'
import { PieceIcon } from './PieceIcon'
import { useBoardMessages } from './messages-context'
import type { PieceThemeId } from './themes'

export interface PromotionPickerProps {
  color: Color
  pieceTheme?: PieceThemeId
  onChoose: (role: PromotionRole) => void
  onCancel: () => void
}

/** Modal choice of promotion piece, laid over the board. Escape or the backdrop cancels. */
export function PromotionPicker({ color, pieceTheme, onChoose, onCancel }: PromotionPickerProps) {
  const messages = useBoardMessages()
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    panel.current?.querySelector('button')?.focus()
  }, [])

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    event.stopPropagation()
    if (event.key === 'Escape') {
      event.preventDefault()
      onCancel()
    } else if (event.key === 'Tab') {
      // Keep focus inside the picker.
      const buttons = [...(panel.current?.querySelectorAll('button') ?? [])]
      const first = buttons[0]
      const last = buttons.at(-1)
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
  }

  return (
    <div
      data-slot="promotion-picker"
      className="absolute inset-0 z-overlay flex items-center justify-center bg-background/70 p-2"
      onKeyDown={onKeyDown}
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel()
      }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={messages.promotionTitle}
        className="flex max-w-full flex-col items-center gap-2 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-raised"
      >
        <p className="text-sm font-medium">{messages.promotionTitle}</p>
        <div className="flex gap-1">
          {PROMOTION_ROLES.map((role) => (
            <button
              key={role}
              type="button"
              aria-label={messages.promotionChoice(role, color)}
              onClick={() => onChoose(role)}
              className="size-14 shrink-0 rounded-md border border-border bg-board-light p-1 outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring"
            >
              <PieceIcon piece={{ color, role }} pieceTheme={pieceTheme} className="size-full" />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="min-h-11 rounded-md px-3 text-sm underline outline-none focus-visible:ring-3 focus-visible:ring-ring"
        >
          {messages.promotionCancel}
        </button>
      </div>
    </div>
  )
}
