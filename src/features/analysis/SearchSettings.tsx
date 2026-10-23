import { RotateCcw } from 'lucide-react'
import { useId } from 'react'
import { useTranslation } from '@/i18n'
import { DEPTH_RANGE, MULTI_PV_RANGE, TIME_RANGE, useAnalysisSettings } from '@/state'
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Switch,
  ToggleGroup,
  ToggleGroupItem,
} from '@/ui'
import { useDeviceLimits, type DeviceLimits } from './hooks'
import { ANALYSIS_NAMESPACE } from './i18n'
import { endsByItself } from './options'

const range = (min: number, max: number): number[] =>
  Array.from({ length: max - min + 1 }, (_, i) => min + i)

/** 16, 32, 64 … up to the device's limit, always including the current and recommended values. */
function hashOptions(max: number, ...extra: number[]): number[] {
  const options = new Set<number>(extra.filter((mb) => mb <= max))
  for (let mb = 16; mb <= max; mb *= 2) options.add(mb)
  return [...options].sort((a, b) => a - b)
}

export interface SearchSettingsProps {
  /** What the device allows; detected from the browser when omitted. */
  limits?: DeviceLimits
}

/**
 * Time or depth limit, auto-move, number of lines and, where the browser allows, threads and hash
 * memory.
 */
export function SearchSettings({ limits }: SearchSettingsProps) {
  const { t } = useTranslation(ANALYSIS_NAMESPACE)
  const detected = useDeviceLimits()
  const { bounds, recommended } = limits ?? detected
  const id = useId()
  const settings = useAnalysisSettings()
  const { update, reset } = useAnalysisSettings.getState()

  const threads = Math.min(settings.threads ?? recommended.threads, bounds.maxThreads)
  const hashMb = Math.min(settings.hashMb ?? recommended.hashMb, bounds.maxHashMb)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor={`${id}-infinite`}>{t('settings.time.infinite')}</Label>
          <Switch
            id={`${id}-infinite`}
            checked={settings.infinite}
            onCheckedChange={(infinite) => update({ infinite })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-2">
            <Label id={`${id}-time`}>{t('settings.time.label')}</Label>
            <span className="font-mono text-sm tabular-nums" aria-hidden="true">
              {settings.infinite
                ? '∞'
                : t('settings.time.value', { seconds: settings.movetimeSec })}
            </span>
          </div>
          <Slider
            aria-labelledby={`${id}-time`}
            min={TIME_RANGE.min}
            max={TIME_RANGE.max}
            step={1}
            disabled={settings.infinite}
            value={[settings.movetimeSec]}
            onValueChange={([seconds]) => seconds !== undefined && update({ movetimeSec: seconds })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${id}-depth`}>{t('settings.depth.label')}</Label>
        <Input
          id={`${id}-depth`}
          type="number"
          inputMode="numeric"
          min={DEPTH_RANGE.min}
          max={DEPTH_RANGE.max}
          placeholder={t('settings.depth.placeholder')}
          aria-describedby={`${id}-depth-hint`}
          value={settings.depth ?? ''}
          onChange={(event) => {
            const value = event.target.valueAsNumber
            update({ depth: Number.isNaN(value) ? null : value })
          }}
        />
        <p id={`${id}-depth-hint`} className="text-xs text-muted-foreground">
          {t('settings.depth.hint')}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor={`${id}-auto-move`}>{t('settings.autoMove.label')}</Label>
          <Switch
            id={`${id}-auto-move`}
            checked={settings.autoMove}
            aria-describedby={`${id}-auto-move-hint`}
            onCheckedChange={(autoMove) => update({ autoMove })}
          />
        </div>
        <p
          id={`${id}-auto-move-hint`}
          data-testid="auto-move-hint"
          className="text-xs text-muted-foreground"
        >
          {endsByItself(settings) ? t('settings.autoMove.hint') : t('settings.autoMove.needsLimit')}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label id={`${id}-lines`}>{t('settings.multiPv.label')}</Label>
        <ToggleGroup
          type="single"
          variant="outline"
          aria-labelledby={`${id}-lines`}
          value={String(settings.multiPv)}
          // A single-select group reports '' when the pressed item is pressed again; keep it.
          onValueChange={(value) => value && update({ multiPv: Number(value) })}
        >
          {range(MULTI_PV_RANGE.min, MULTI_PV_RANGE.max).map((count) => (
            <ToggleGroupItem
              key={count}
              value={String(count)}
              aria-label={t('settings.multiPv.option', { count })}
            >
              {count}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {bounds.maxThreads > 1 ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-2">
            <Label id={`${id}-threads`}>{t('settings.threads.label')}</Label>
            <span className="font-mono text-sm tabular-nums" aria-hidden="true">
              {threads}
            </span>
          </div>
          <Slider
            aria-labelledby={`${id}-threads`}
            min={1}
            max={bounds.maxThreads}
            step={1}
            value={[threads]}
            onValueChange={([count]) => count !== undefined && update({ threads: count })}
          />
          <p className="text-xs text-muted-foreground">
            {t('settings.threads.hint', { count: recommended.threads })}
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t('settings.singleThreaded')}</p>
      )}

      <div className="flex flex-col gap-2">
        <Label id={`${id}-hash`}>{t('settings.hash.label')}</Label>
        <Select value={String(hashMb)} onValueChange={(value) => update({ hashMb: Number(value) })}>
          <SelectTrigger aria-labelledby={`${id}-hash`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {hashOptions(bounds.maxHashMb, hashMb, recommended.hashMb).map((mb) => (
              <SelectItem key={mb} value={String(mb)}>
                {t('settings.hash.option', { mb })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{t('settings.appliesNext')}</p>
        <Button type="button" variant="outline" size="sm" onClick={reset}>
          <RotateCcw aria-hidden data-icon="inline-start" />
          {t('settings.reset')}
        </Button>
      </div>
    </div>
  )
}
