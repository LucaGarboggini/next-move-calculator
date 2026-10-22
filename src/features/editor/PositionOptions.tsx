import {
  candidateEpSquares,
  canHoldCastlingRight,
  COLORS,
  CASTLING_SIDES,
  type Color,
  isSquare,
} from '@/core'
import { useTranslation } from '@/i18n'
import { useEditorStore } from '@/state'
import {
  Checkbox,
  Label,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui'
import { EDITOR_NAMESPACE } from './i18n'

const NO_EN_PASSANT = 'none'
const isColor = (value: string): value is Color => value === 'white' || value === 'black'

/** Side to move, castling rights and en passant square of the position being edited. */
export function PositionOptions() {
  const { t } = useTranslation(EDITOR_NAMESPACE)
  const { setup } = useEditorStore((s) => s.document)
  const { setTurn, setCastling, setEpSquare } = useEditorStore.getState()

  // Offer what is possible, plus an impossible current value so it can be seen and changed.
  const candidates = candidateEpSquares(setup)
  const epOptions =
    setup.epSquare && !candidates.includes(setup.epSquare)
      ? [setup.epSquare, ...candidates]
      : candidates

  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">{t('options.turn.label')}</legend>
        <RadioGroup
          value={setup.turn}
          onValueChange={(value) => isColor(value) && setTurn(value)}
          aria-label={t('options.turn.label')}
          className="grid-cols-2"
        >
          {COLORS.map((color) => (
            <div key={color} className="flex items-center gap-2">
              <RadioGroupItem value={color} id={`turn-${color}`} />
              <Label htmlFor={`turn-${color}`}>{t(`options.turn.${color}`)}</Label>
            </div>
          ))}
        </RadioGroup>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">{t('options.castling.label')}</legend>
        <div className="grid grid-cols-1 gap-2">
          {COLORS.flatMap((color) =>
            CASTLING_SIDES.map((side) => {
              const checked = setup.castling[color][side]
              const id = `castling-${color}-${side}`
              return (
                <div key={id} className="flex items-center gap-2">
                  <Checkbox
                    id={id}
                    checked={checked}
                    // A right the pieces cannot hold stays switchable off, never on.
                    disabled={!checked && !canHoldCastlingRight(setup, color, side)}
                    onCheckedChange={(value) => setCastling(color, side, value === true)}
                  />
                  <Label htmlFor={id}>{t(`options.castling.${color}.${side}`)}</Label>
                </div>
              )
            }),
          )}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <Label htmlFor="en-passant">{t('options.enPassant.label')}</Label>
        <Select
          value={setup.epSquare ?? NO_EN_PASSANT}
          onValueChange={(value) => setEpSquare(isSquare(value) ? value : undefined)}
          disabled={epOptions.length === 0}
        >
          <SelectTrigger id="en-passant" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_EN_PASSANT}>{t('options.enPassant.none')}</SelectItem>
            {epOptions.map((square) => (
              <SelectItem key={square} value={square}>
                {square}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {epOptions.length === 0 && (
          <p className="text-xs text-muted-foreground">{t('options.enPassant.unavailable')}</p>
        )}
      </div>
    </div>
  )
}
