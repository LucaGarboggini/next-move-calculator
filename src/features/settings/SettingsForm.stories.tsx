import type { Meta, StoryObj } from '@storybook/react-vite'
import { detectCapabilities } from '@/engine'
import { SettingsForm } from './SettingsForm'

const meta = {
  title: 'features/settings/SettingsForm',
  component: SettingsForm,
  decorators: [
    (Story) => (
      <div className="w-96 max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SettingsForm>

export default meta
type Story = StoryObj<typeof meta>

export const Desktop: Story = {
  args: {
    capabilities: detectCapabilities({
      crossOriginIsolated: true,
      hasSharedArrayBuffer: true,
      hardwareConcurrency: 8,
      deviceMemory: 8,
      userAgent: 'Mozilla/5.0 (Macintosh)',
    }),
  },
}

/** Choosing the Full engine here lists why it may be a bad idea. */
export const Phone: Story = {
  args: {
    capabilities: detectCapabilities({
      hardwareConcurrency: 4,
      deviceMemory: 2,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile',
    }),
  },
}
