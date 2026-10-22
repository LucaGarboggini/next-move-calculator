import { useTranslation } from '@/i18n'
import { useEditorSnapshot, useEditorStore } from '@/state'
import { useShortcuts, type Shortcut } from '@/ui'
import { EDITOR_NAMESPACE } from './i18n'

/** Keyboard shortcuts for the board and the move list. Mounted once by `EditorProvider`. */
export function useEditorShortcuts(): void {
  const { t } = useTranslation(EDITOR_NAMESPACE)
  const { position } = useEditorSnapshot()
  const group = t('shortcuts.group')
  const store = useEditorStore.getState

  /** Moves the cursor of the game, if there is a game. */
  const step = (target: (cursor: number, last: number) => number) => () => {
    const { game } = store().document
    if (game) store().goToPly(target(game.cursor, game.entries.length))
  }
  const clamp = (ply: number, last: number) => Math.min(last, Math.max(0, ply))

  const shortcuts: Shortcut[] = [
    { id: 'flip', keys: 'f', label: t('shortcuts.flip'), group, run: () => store().flip() },
    { id: 'undo', keys: 'mod+z', label: t('shortcuts.undo'), group, run: () => store().undo() },
    {
      id: 'redo',
      keys: 'mod+shift+z',
      label: t('shortcuts.redo'),
      group,
      run: () => store().redo(),
    },
    {
      id: 'mode',
      keys: 'm',
      label: t('shortcuts.mode'),
      group,
      run: () => {
        const { mode, setMode } = store()
        // Moves can only be played from a legal position.
        if (mode === 'play') setMode('edit')
        else if (position) setMode('play')
      },
    },
    {
      id: 'previous',
      keys: 'arrowleft',
      label: t('shortcuts.previous'),
      group,
      run: step((cursor, last) => clamp(cursor - 1, last)),
    },
    {
      id: 'next',
      keys: 'arrowright',
      label: t('shortcuts.next'),
      group,
      run: step((cursor, last) => clamp(cursor + 1, last)),
    },
    // Home and End are left to the page, which uses them to scroll.
    {
      id: 'first',
      keys: 'shift+arrowleft',
      label: t('shortcuts.first'),
      group,
      run: step(() => 0),
    },
    {
      id: 'last',
      keys: 'shift+arrowright',
      label: t('shortcuts.last'),
      group,
      run: step((_, last) => last),
    },
  ]
  useShortcuts(shortcuts)
}
