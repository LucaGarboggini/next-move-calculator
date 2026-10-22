// Public API of the settings feature.
import './i18n'

// The dialogs and the form are not exported: SettingsControls loads them on demand (ADR 0011).
export { LanguageSelect } from './LanguageSelect'
export { SettingsControls } from './SettingsControls'
export { ThemeToggle } from './ThemeToggle'
