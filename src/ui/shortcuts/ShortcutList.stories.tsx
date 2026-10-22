import type { Meta, StoryObj } from '@storybook/react-vite'
import { ShortcutList } from './ShortcutList'

const meta = {
  title: 'ui/ShortcutList',
  component: ShortcutList,
  args: {
    shortcuts: [
      { id: 'flip', keys: 'f', label: 'Flip the board', group: 'Board' },
      { id: 'undo', keys: 'mod+z', label: 'Undo', group: 'Board' },
      { id: 'redo', keys: 'mod+shift+z', label: 'Redo', group: 'Board' },
      { id: 'prev', keys: 'arrowleft', label: 'Previous move', group: 'Moves' },
      { id: 'help', keys: '?', label: 'Show shortcuts', group: 'General' },
    ],
  },
} satisfies Meta<typeof ShortcutList>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Empty: Story = { args: { shortcuts: [], empty: 'No shortcuts.' } }
