import { useTranslation } from '@/i18n'
import type { EngineCapabilities } from '@/engine'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/ui'
import { SETTINGS_NAMESPACE } from './i18n'
import { SettingsForm } from './SettingsForm'

export interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  capabilities?: EngineCapabilities
}

export function SettingsDialog({ open, onOpenChange, capabilities }: SettingsDialogProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t('close')} className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <SettingsForm {...(capabilities && { capabilities })} />
      </DialogContent>
    </Dialog>
  )
}
