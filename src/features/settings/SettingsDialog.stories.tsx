import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { SettingsDialog } from './SettingsDialog'

const meta = {
  title: 'features/settings/SettingsDialog',
  component: SettingsDialog,
  args: { open: true, onOpenChange: fn() },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof SettingsDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {}
