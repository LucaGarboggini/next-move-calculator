import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { ShortcutsProvider, useShortcuts } from '@/ui'
import { ShortcutsDialog } from './ShortcutsDialog'

function Registered() {
  useShortcuts([
    { id: 'flip', keys: 'f', label: 'Flip the board', group: 'Board and moves', run: fn() },
    { id: 'undo', keys: 'mod+z', label: 'Undo', group: 'Board and moves', run: fn() },
    { id: 'calc', keys: 'mod+enter', label: 'Calculate, or stop', group: 'Analysis', run: fn() },
  ])
  return null
}

const meta = {
  title: 'features/settings/ShortcutsDialog',
  component: ShortcutsDialog,
  args: { open: true, onOpenChange: fn() },
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <ShortcutsProvider>
        <Registered />
        <Story />
      </ShortcutsProvider>
    ),
  ],
} satisfies Meta<typeof ShortcutsDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {}
