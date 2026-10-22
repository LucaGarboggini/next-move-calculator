import { Eraser, Hand } from 'lucide-react'
import { PieceIcon, useBoardMessages } from '@/board'
import { COLORS, ROLES, type Piece } from '@/core'
import { useTranslation } from '@/i18n'
import { isSameTool, useEditorStore, useSettings, type EditorTool } from '@/state'
import { Button, cn } from '@/ui'
import { useBoardHandle } from './board-handle'
import { EDITOR_NAMESPACE } from './i18n'

const SLOT = 'flex size-11 items-center justify-center rounded-md border border-border p-1'

/**
 * Spare pieces. Picking one makes taps on the board place it; pressing and dragging
 * one carries a copy onto the board. "Move" goes back to just moving pieces.
 */
export function Palette() {
  const { t } = useTranslation(EDITOR_NAMESPACE)
  const messages = useBoardMessages()
  const board = useBoardHandle()
  const tool = useEditorStore((s) => s.tool)
  const setTool = useEditorStore((s) => s.setTool)
  const pieceTheme = useSettings((s) => s.pieceTheme)

  const toolButton = (candidate: EditorTool, label: string, content: React.ReactNode) => {
    const active = isSameTool(tool, candidate)
    return (
      <Button
        key={label}
        type="button"
        variant={active ? 'default' : 'outline'}
        aria-pressed={active}
        aria-label={label}
        title={label}
        onClick={() => setTool(candidate)}
        className={cn(SLOT, 'h-auto')}
      >
        {content}
      </Button>
    )
  }

  const pieceButton = (piece: Piece) => {
    const label = messages.pieceName(piece)
    const candidate: EditorTool = { kind: 'place', piece }
    const active = isSameTool(tool, candidate)
    return (
      <Button
        key={`${piece.color}-${piece.role}`}
        type="button"
        variant={active ? 'default' : 'outline'}
        aria-pressed={active}
        aria-label={label}
        title={label}
        onClick={() => setTool(candidate)}
        // Dragging from the palette must not scroll the page on touch screens.
        onPointerDown={(event) => board.current?.dragNewPiece(piece, event.nativeEvent)}
        className={cn(SLOT, 'h-auto touch-none')}
      >
        <PieceIcon piece={piece} pieceTheme={pieceTheme} className="size-full" />
      </Button>
    )
  }

  return (
    <section aria-label={t('palette.label')} className="flex flex-col gap-2">
      {COLORS.map((color) => (
        <div
          key={color}
          role="group"
          aria-label={t(`palette.${color}`)}
          className="flex flex-wrap gap-1"
        >
          {ROLES.map((role) => pieceButton({ color, role }))}
        </div>
      ))}
      <div role="group" aria-label={t('palette.label')} className="flex flex-wrap gap-1">
        {toolButton(null, t('palette.move'), <Hand aria-hidden className="size-5" />)}
        {toolButton(
          { kind: 'erase' },
          t('palette.erase'),
          <Eraser aria-hidden className="size-5" />,
        )}
      </div>
      <p className="text-xs text-muted-foreground">{t('palette.hint')}</p>
    </section>
  )
}
