/**
 * Shortcut keys are written as `"mod+shift+z"`, `"f"`, `"arrowleft"` or `"?"`. `mod` is Ctrl, or
 * Command on a Mac. The key part is `KeyboardEvent.key` in lower case.
 */
export interface ParsedKeys {
  readonly key: string
  readonly mod: boolean
  readonly shift: boolean
  readonly alt: boolean
}

export function parseKeys(keys: string): ParsedKeys {
  const parts = keys.toLowerCase().split('+')
  // "+" itself is the last part when the string ends with a bare "+" (e.g. "mod++").
  const key = keys.endsWith('+') ? '+' : (parts.pop() ?? '')
  return {
    key,
    mod: parts.includes('mod'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt'),
  }
}

/** Punctuation such as "?" needs Shift on some layouts and not on others, so Shift is ignored. */
const isSymbol = (key: string): boolean => key.length === 1 && !/[a-z0-9]/.test(key)

export function matchesKeys(
  event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey'>,
  keys: string,
): boolean {
  const wanted = parseKeys(keys)
  if (event.key.toLowerCase() !== wanted.key) return false
  if ((event.ctrlKey || event.metaKey) !== wanted.mod) return false
  if (event.altKey !== wanted.alt) return false
  return isSymbol(wanted.key) || event.shiftKey === wanted.shift
}

const KEY_NAMES: Readonly<Record<string, string>> = {
  arrowleft: '←',
  arrowright: '→',
  arrowup: '↑',
  arrowdown: '↓',
  escape: 'Esc',
  enter: 'Enter',
  home: 'Home',
  end: 'End',
  ' ': 'Space',
}

/** The parts of a shortcut as shown on a keycap, e.g. `["⌘", "⇧", "Z"]` or `["Ctrl", "Z"]`. */
export function keyCaps(keys: string, mac: boolean): string[] {
  const { key, mod, shift, alt } = parseKeys(keys)
  const name = KEY_NAMES[key] ?? key.toUpperCase()
  return [
    ...(mod ? [mac ? '⌘' : 'Ctrl'] : []),
    ...(alt ? [mac ? '⌥' : 'Alt'] : []),
    ...(shift ? [mac ? '⇧' : 'Shift'] : []),
    name,
  ]
}

export const isMac = (): boolean =>
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform)

/** Fields and widgets that use the keyboard themselves: shortcuts must not fire from inside them. */
const OWN_KEYBOARD =
  'input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="slider"], [role="radio"], [role="combobox"], [role="listbox"], [role="menu"], [role="menuitem"], [role="tab"], [role="dialog"], [role="alertdialog"]'

export function usesOwnKeyboard(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(OWN_KEYBOARD) !== null
}
