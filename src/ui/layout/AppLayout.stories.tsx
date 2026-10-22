import type { Meta, StoryObj } from '@storybook/react-vite'
import { AppLayout } from './AppLayout'

const meta = {
  title: 'ui/AppLayout',
  component: AppLayout,
  parameters: { layout: 'fullscreen' },
  args: {
    board: <div className="aspect-square w-full max-w-xl rounded-lg bg-muted" />,
    panels: <div className="h-40 rounded-lg bg-card shadow-raised" />,
  },
} satisfies Meta<typeof AppLayout>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
