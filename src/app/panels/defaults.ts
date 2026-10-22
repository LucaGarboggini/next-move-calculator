import { registerPanel } from './registry'
import { WelcomePanel } from './WelcomePanel'

/** Composition point: features add their panels here with `registerPanel`. */
export function registerDefaultPanels(): void {
  registerPanel({ id: 'welcome', order: 0, component: WelcomePanel })
}
