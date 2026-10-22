import type { Meta, StoryObj } from '@storybook/react-vite'
import { Card, CardContent, CardHeader, CardTitle } from '../primitives/card'
import { AppHeader } from './AppHeader'
import { AppLayout } from './AppLayout'
import { BoardFrame } from './BoardFrame'

const panel = (title: string) => (
  <Card key={title}>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent className="h-24" />
  </Card>
)

const meta = {
  title: 'ui/AppLayout',
  component: AppLayout,
  parameters: { layout: 'fullscreen' },
  args: {
    header: <AppHeader title="Next-Move Calculator" />,
    board: <BoardFrame className="rounded-md bg-board-dark" />,
    panels: [panel('Editor'), panel('Analysis')],
  },
} satisfies Meta<typeof AppLayout>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
/** Use the viewport toolbar to check phone, tablet and desktop. */
export const Phone: Story = { globals: { viewport: { value: 'mobile1', isRotated: false } } }
