import type { Meta, StoryObj } from '@storybook/react-vite'
import { ShortcutsProvider } from '@/ui'
import { SettingsControls } from './SettingsControls'

const meta = {
  title: 'features/settings/SettingsControls',
  component: SettingsControls,
  decorators: [
    (Story) => (
      <ShortcutsProvider>
        <div className="flex gap-2">
          <Story />
        </div>
      </ShortcutsProvider>
    ),
  ],
} satisfies Meta<typeof SettingsControls>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
