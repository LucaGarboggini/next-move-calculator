import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../primitives/button'
import { AppHeader } from './AppHeader'

const meta = {
  title: 'ui/AppHeader',
  component: AppHeader,
  parameters: { layout: 'fullscreen' },
  args: { title: 'Next-Move Calculator', actions: <Button variant="outline">Action</Button> },
} satisfies Meta<typeof AppHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const TitleOnly: Story = { args: { actions: undefined } }
