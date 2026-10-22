import { Clipboard, FileInput } from 'lucide-react'
import { useState, type ClipboardEvent, type KeyboardEvent } from 'react'
import type { ValidationIssue } from '@/core'
import { useTranslation } from '@/i18n'
import { documentPgn, useEditorSnapshot, useEditorStore } from '@/state'
import { Alert, AlertDescription, Button, Label, Textarea } from '@/ui'
import { describeIssue } from './issues'
import { EDITOR_NAMESPACE } from './i18n'

type CopyState = 'idle' | 'copied' | 'failed'

/**
 * The position as FEN, always in sync with the board. Pasting a FEN or PGN into it
 * loads it at once; typed text loads with the button (or Ctrl/Cmd+Enter). A text that
 * cannot be loaded stays in the box with the reasons below it.
 */
export function FenPgnField() {
  const { t } = useTranslation(EDITOR_NAMESPACE)
  const load = useEditorStore((s) => s.load)
  const document = useEditorStore((s) => s.document)
  const { fen } = useEditorSnapshot()

  const [draft, setDraft] = useState<string | null>(null)
  const [problems, setProblems] = useState<readonly ValidationIssue[]>([])
  const [copy, setCopy] = useState<CopyState>('idle')

  // The box mirrors the board: when the position is replaced elsewhere (even by an identical one), a stale draft goes away.
  const [shownDocument, setShownDocument] = useState(document)
  if (shownDocument !== document) {
    setShownDocument(document)
    setDraft(null)
    setProblems([])
    setCopy('idle')
  }

  const apply = (text: string) => {
    const failures = load(text)
    setProblems(failures)
    if (failures.length === 0) setDraft(null)
  }

  const onPaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    // Only a box that still mirrors the board is replaced wholesale; otherwise paste normally.
    if (draft !== null) return
    event.preventDefault()
    const text = event.clipboardData.getData('text')
    setDraft(text)
    apply(text)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && draft !== null) {
      event.preventDefault()
      apply(draft)
    }
  }

  const copyText = async (text: string | undefined) => {
    if (text === undefined) return
    try {
      await navigator.clipboard.writeText(text)
      setCopy('copied')
    } catch {
      setCopy('failed')
    }
  }

  const pgn = documentPgn(document)

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="fen-input">{t('fen.label')}</Label>
      <Textarea
        id="fen-input"
        rows={3}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        className="font-mono"
        placeholder={t('fen.placeholder')}
        value={draft ?? fen}
        aria-invalid={problems.length > 0}
        aria-describedby={problems.length > 0 ? 'fen-problems' : undefined}
        onChange={(event) => {
          setDraft(event.target.value)
          setProblems([])
          setCopy('idle')
        }}
        onPaste={onPaste}
        onKeyDown={onKeyDown}
      />

      {problems.length > 0 && (
        <Alert variant="destructive" role="alert" id="fen-problems">
          <AlertDescription>
            <p className="font-medium text-card-foreground">{t('fen.loadFailed')}</p>
            <ul className="list-disc pl-4">
              {problems.map((issue, index) => (
                <li key={`${issue.code}-${index}`}>{describeIssue(t, issue)}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={draft === null}
          onClick={() => draft !== null && apply(draft)}
        >
          <FileInput aria-hidden />
          {t('fen.load')}
        </Button>
        <Button type="button" variant="outline" onClick={() => void copyText(fen)}>
          <Clipboard aria-hidden />
          {t('fen.copyFen')}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pgn === undefined}
          onClick={() => void copyText(pgn)}
        >
          <Clipboard aria-hidden />
          {t('fen.copyPgn')}
        </Button>
      </div>

      <p role="status" className="min-h-4 text-xs text-muted-foreground">
        {copy === 'copied' && t('fen.copied')}
        {copy === 'failed' && t('fen.copyFailed')}
      </p>
    </div>
  )
}
