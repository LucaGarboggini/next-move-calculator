import { AppLayout } from '@/ui'
import { getPanels } from './panels/registry'

/** Exposes a board area and a panel area; panels arrive via `registerPanel`. */
export function Shell() {
  return (
    <AppLayout
      board={null}
      panels={getPanels().map(({ id, component: Panel }) => (
        <Panel key={id} />
      ))}
    />
  )
}
