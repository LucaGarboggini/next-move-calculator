import type { Meta, StoryObj } from '@storybook/react-vite'
import { Skeleton } from './skeleton'

const meta = { title: 'ui/Skeleton', component: Skeleton } satisfies Meta<typeof Skeleton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="grid w-64 gap-2">
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-2/3" />
    </div>
  ),
}
