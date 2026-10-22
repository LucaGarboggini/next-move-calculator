import type { Meta, StoryObj } from '@storybook/react-vite'
import { detectCapabilities } from '@/engine'
import { EngineSizeSetting } from './EngineSizeSetting'

const meta = {
  title: 'features/settings/EngineSizeSetting',
  component: EngineSizeSetting,
  decorators: [
    (Story) => (
      <div className="w-96 max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EngineSizeSetting>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
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

export const OnAPhone: Story = {
  args: {
    capabilities: detectCapabilities({
      hardwareConcurrency: 4,
      deviceMemory: 2,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile',
    }),
  },
}
