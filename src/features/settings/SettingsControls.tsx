import { Keyboard, Settings } from 'lucide-react'
import { lazy, Suspense, useState } from 'react'
import { useTranslation } from '@/i18n'
import { Button, useShortcuts } from '@/ui'
import { SETTINGS_NAMESPACE } from './i18n'

// The dialogs are only needed once opened: they load on first use (or when the button is
// hovered or focused) instead of weighing down the first paint.
const loadSettingsDialog = () => import('./SettingsDialog')
const loadShortcutsDialog = () => import('./ShortcutsDialog')
const SettingsDialog = lazy(() => loadSettingsDialog().then((m) => ({ default: m.SettingsDialog })))
const ShortcutsDialog = lazy(() =>
  loadShortcutsDialog().then((m) => ({ default: m.ShortcutsDialog })),
)

/** Header buttons that open the settings and the shortcut list; `?` opens the list too. */
export function SettingsControls() {
  const { t } = useTranslation(SETTINGS_NAMESPACE)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  // Mounted from the first opening on, so closing keeps its exit animation.
  const [settingsUsed, setSettingsUsed] = useState(false)
  const [shortcutsUsed, setShortcutsUsed] = useState(false)
  const showShortcuts = () => {
    setShortcutsUsed(true)
    setShortcutsOpen(true)
  }
  const showSettings = () => {
    setSettingsUsed(true)
    setSettingsOpen(true)
  }

  useShortcuts([
    {
      id: 'help',
      keys: '?',
      label: t('shortcuts.help'),
      group: t('shortcuts.group'),
      run: showShortcuts,
    },
  ])

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={t('shortcuts.show')}
        title={t('shortcuts.show')}
        onPointerEnter={() => void loadShortcutsDialog()}
        onFocus={() => void loadShortcutsDialog()}
        onClick={showShortcuts}
      >
        <Keyboard aria-hidden />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={t('open')}
        title={t('open')}
        onPointerEnter={() => void loadSettingsDialog()}
        onFocus={() => void loadSettingsDialog()}
        onClick={showSettings}
      >
        <Settings aria-hidden />
      </Button>
      <Suspense fallback={null}>
        {settingsUsed && <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />}
        {shortcutsUsed && <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />}
      </Suspense>
    </>
  )
}
