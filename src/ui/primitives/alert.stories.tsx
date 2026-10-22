import type { Meta, StoryObj } from '@storybook/react-vite'
import { AlertCircle, CheckCircle2, TriangleAlert } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from './alert'

const meta = {
  title: 'ui/Alert',
  component: Alert,
  argTypes: {
    variant: { control: 'select', options: ['default', 'destructive', 'warning', 'success'] },
  },
  decorators: [
    (Story) => (
      <div className="w-80 max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <Alert {...args}>
      <AlertTitle>Heads up</AlertTitle>
      <AlertDescription>Something worth knowing about.</AlertDescription>
    </Alert>
  ),
}

export const Destructive: Story = {
  render: (args) => (
    <Alert {...args} variant="destructive">
      <AlertCircle aria-hidden />
      <AlertTitle>This position cannot be analyzed</AlertTitle>
      <AlertDescription>White needs a king.</AlertDescription>
    </Alert>
  ),
}

export const Warning: Story = {
  render: (args) => (
    <Alert {...args} variant="warning">
      <TriangleAlert aria-hidden />
      <AlertTitle>Unusual position</AlertTitle>
      <AlertDescription>White has more than 8 pawns.</AlertDescription>
    </Alert>
  ),
}

export const Success: Story = {
  render: (args) => (
    <Alert {...args} variant="success">
      <CheckCircle2 aria-hidden />
      <AlertTitle>Ready for analysis</AlertTitle>
    </Alert>
  ),
}
