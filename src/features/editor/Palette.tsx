import type { ComponentProps, ReactNode } from 'react'
import { Eraser, Hand } from 'lucide-react'
import { PieceIcon, useBoardMessages, useSparePieceDrag } from '@/board'
import { COLORS, ROLES, type Piece } from '@/core'
import { useTranslation } from '@/i18n'
import { isSameTool, useEditorStore, useSettings, type EditorTool } from '@/state'
import { Button, cn } from '@/ui'
import { useBoardHandle } from './board-handle'
import { EDITOR_NAMESPACE } from './i18n'

/**
 * One palette slot; the selected tool gets a thick border and a tinted fill in every theme. Slots
 * are square so pieces centre in them. `cn` does not know the button's `h-control-md` conflicts
 * with `size-11` and keeps both, so `min-h-11` holds the height at 44 px on every pointer.
 */
const SLOT = cn(
  'flex size-11 min-h-11 items-center justify-center rounded-md border border-border p-1',
  'aria-pressed:border-2 aria-pressed:border-primary aria-pressed:bg-accent aria-pressed:text-accent-foreground',
  'dark:aria-pressed:border-primary dark:aria-pressed:bg-accent',
)

interface SlotProps {
  tool: EditorTool
  label: string
  children: ReactNode
}

/** A palette button that selects `tool`. */
function ToolSlot({ tool, label, children, ...props }: SlotProps & ComponentProps<'button'>) {
  const active = useEditorStore((s) => isSameTool(s.tool, tool))
  const setTool = useEditorStore((s) => s.setTool)
  return (
    <Button
      type="button"
      variant="outline"
      aria-pressed={active}
      aria-label={label}
      title={label}
      onClick={() => setTool(tool)}
      {...props}
      className={cn(SLOT, props.className)}
    >
      {children}
    </Button>
  )
}

/** A spare piece: tap or click to place it with taps on the board, or drag it onto the board. */
function SparePiece({ piece }: { piece: Piece }) {
  const messages = useBoardMessages()
  const pieceTheme = useSettings((s) => s.pieceTheme)
  const drag = useSparePieceDrag(useBoardHandle(), piece)
  return (
    <ToolSlot
      tool={{ kind: 'place', piece }}
      label={messages.pieceName(piece)}
      {...drag}
      // Dragging from the palette must not scroll the page on touch screens.
      className="touch-none"
    >
      <PieceIcon piece={piece} pieceTheme={pieceTheme} className="size-full" />
    </ToolSlot>
  )
}

/**
 * Spare pieces. Picking one makes taps on the board place it, as often as wanted; pressing and
 * dragging one carries a copy onto the board. The eraser removes pieces with taps, and "Move"
 * goes back to just moving pieces. Works alike with touch, mouse, pen and keyboard.
 */
export function Palette() {
  const { t } = useTranslation(EDITOR_NAMESPACE)
  const messages = useBoardMessages()
  const tool = useEditorStore((s) => s.tool)

  const status =
    tool === null
      ? t('palette.hint')
      : tool.kind === 'erase'
        ? t('palette.erasing')
        : t('palette.placing', { piece: messages.pieceName(tool.piece) })

  return (
    <section aria-label={t('palette.label')} className="flex flex-col gap-2">
      {COLORS.map((color) => (
        <div
          key={color}
          role="group"
          aria-label={t(`palette.${color}`)}
          className="flex flex-wrap gap-1"
        >
          {ROLES.map((role) => (
            <SparePiece key={role} piece={{ color, role }} />
          ))}
        </div>
      ))}
      <div role="group" aria-label={t('palette.label')} className="flex flex-wrap gap-1">
        <ToolSlot tool={null} label={t('palette.move')}>
          <Hand aria-hidden className="size-5" />
        </ToolSlot>
        <ToolSlot tool={{ kind: 'erase' }} label={t('palette.erase')}>
          <Eraser aria-hidden className="size-5" />
        </ToolSlot>
      </div>
      <p role="status" className="text-xs text-muted-foreground">
        {status}
      </p>
    </section>
  )
}
