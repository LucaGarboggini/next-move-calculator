import { useTranslation } from '@/i18n'
import { useSettings } from '@/state'
import {
  Alert,
  AlertDescription,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  ShortcutList,
  useRegisteredShortcuts,
} from '@/ui'
import { SETTINGS_NAMESPACE } from './i18n'

export interface ShortcutsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Every keyboard shortcut the features registered, grouped. */
export function ShortcutsDialog({ open, onOpenChange }: ShortcutsDialogProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE)
  const shortcuts = useRegisteredShortcuts()
  const enabled = useSettings((s) => s.shortcuts)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t('close')} className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('shortcuts.title')}</DialogTitle>
          <DialogDescription>{t('shortcuts.description')}</DialogDescription>
        </DialogHeader>
        {!enabled && (
          <Alert>
            <AlertDescription>{t('shortcuts.off')}</AlertDescription>
          </Alert>
        )}
        <ShortcutList shortcuts={shortcuts} empty={t('shortcuts.empty')} />
      </DialogContent>
    </Dialog>
  )
}
