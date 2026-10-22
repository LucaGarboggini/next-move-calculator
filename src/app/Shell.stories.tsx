import type { Meta, StoryObj } from '@storybook/react-vite'
import { Shell } from './Shell'

const meta = {
  title: 'app/Shell',
  component: Shell,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Shell>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}
