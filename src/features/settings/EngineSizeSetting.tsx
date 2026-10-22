import { useId, useState } from 'react'
import { useTranslation } from '@/i18n'
import {
  detectCapabilities,
  ENGINE_DOWNLOAD_BYTES,
  fullEngineWarnings,
  type EngineCapabilities,
} from '@/engine'
import { ENGINE_SIZES, useSettings } from '@/state'
import {
  Alert,
  AlertDescription,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  RadioGroup,
  RadioGroupItem,
} from '@/ui'
import { SETTINGS_NAMESPACE } from './i18n'

const megabytes = (bytes: number): number => Math.floor(bytes / (1024 * 1024))

export interface EngineSizeSettingProps {
  /** What the browser allows; detected when omitted (stories and tests pass their own). */
  capabilities?: EngineCapabilities
}

/**
 * Lite (default) or Full. Lite applies at once. Full asks first, saying how large it is and, on
 * phones, low-memory or single-threaded browsers, why it may not be a good idea.
 */
export function EngineSizeSetting({ capabilities }: EngineSizeSettingProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE)
  const id = useId()
  const engineSize = useSettings((s) => s.engineSize)
  const update = useSettings((s) => s.update)
  const [confirming, setConfirming] = useState(false)

  const warnings = fullEngineWarnings(capabilities ?? detectCapabilities())
  const sizeOf = (size: (typeof ENGINE_SIZES)[number]) => ({
    size: megabytes(ENGINE_DOWNLOAD_BYTES[size]),
  })

  return (
    <div className="flex flex-col gap-2">
      <Label id={`${id}-label`}>{t('engine.label')}</Label>
      <RadioGroup
        aria-labelledby={`${id}-label`}
        value={engineSize}
        onValueChange={(value) => {
          if (value === 'full') setConfirming(true)
          else if (value === 'lite') update({ engineSize: 'lite' })
        }}
      >
        {ENGINE_SIZES.map((size) => (
          <div key={size} className="flex items-start gap-3 rounded-md border border-border p-3">
            <RadioGroupItem
              value={size}
              id={`${id}-${size}`}
              aria-describedby={`${id}-${size}-hint`}
            />
            <div className="flex flex-col gap-0.5">
              <Label htmlFor={`${id}-${size}`}>{t(`engine.${size}`)}</Label>
              <p id={`${id}-${size}-hint`} className="text-xs text-muted-foreground">
                {t(`engine.${size}Hint`, sizeOf(size))}
              </p>
            </div>
          </div>
        ))}
      </RadioGroup>
      <p className="text-xs text-muted-foreground">{t('engine.appliesNext')}</p>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent closeLabel={t('close')}>
          <DialogHeader>
            <DialogTitle>{t('fullWarning.title')}</DialogTitle>
            <DialogDescription>{t('fullWarning.description', sizeOf('full'))}</DialogDescription>
          </DialogHeader>
          {warnings.length > 0 && (
            <Alert>
              <AlertDescription>
                <ul className="flex list-disc flex-col gap-1 pl-4">
                  {warnings.map((warning) => (
                    <li key={warning}>{t(`fullWarning.${warning}`)}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirming(false)}>
              {t('fullWarning.cancel')}
            </Button>
            <Button
              type="button"
              onClick={() => {
                update({ engineSize: 'full' })
                setConfirming(false)
              }}
            >
              {t('fullWarning.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
