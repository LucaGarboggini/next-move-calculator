import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './card'

const meta = {
  title: 'ui/Card',
  component: Card,
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>Best move</CardTitle>
        <CardDescription>Depth 24 · 1.2M nodes/s</CardDescription>
        <CardAction>
          <Button size="sm" variant="outline">
            Copy
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p>1. e4 e5 2. Nf3 Nc6 3. Bb5</p>
      </CardContent>
      <CardFooter>
        <Button size="sm">Play</Button>
      </CardFooter>
    </Card>
  ),
}
