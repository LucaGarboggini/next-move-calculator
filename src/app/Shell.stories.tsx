import type { Meta, StoryObj } from '@storybook/react-vite'
import { Providers } from './providers/Providers'
import { Shell } from './Shell'
import { WelcomePanel } from './panels/WelcomePanel'
import { clearPanels, registerPanel } from './panels/registry'

const meta = {
  title: 'app/Shell',
  component: Shell,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <Providers>
        <Story />
      </Providers>
    ),
  ],
  beforeEach: () => {
    clearPanels()
    registerPanel({ id: 'welcome', order: 0, component: WelcomePanel })
    return clearPanels
  },
} satisfies Meta<typeof Shell>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Phone: Story = { globals: { viewport: { value: 'mobile1', isRotated: false } } }
export const TabletPortrait: Story = {
  globals: { viewport: { value: 'tablet', isRotated: false } },
}
export const NoPanels: Story = {
  beforeEach: () => {
    clearPanels()
  },
}
