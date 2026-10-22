import { BoardFrame, cn } from '@/ui'
import { useTranslation } from '@/i18n'

const SQUARES = Array.from({ length: 64 }, (_, i) => i)

/** Empty board drawn with board tokens; replaced by the real board in a later deliverable. */
export function BoardPlaceholder() {
  const { t } = useTranslation()
  return (
    <BoardFrame
      role="img"
      aria-label={t('board.placeholder')}
      className="grid grid-cols-8 grid-rows-8 overflow-hidden rounded-md shadow-raised"
    >
      {SQUARES.map((i) => (
        <div
          key={i}
          className={cn(
            (Math.floor(i / 8) + (i % 8)) % 2 === 0 ? 'bg-board-light' : 'bg-board-dark',
          )}
        />
      ))}
    </BoardFrame>
  )
}
