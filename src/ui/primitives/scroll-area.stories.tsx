import type { Meta, StoryObj } from '@storybook/react-vite'
import { ScrollArea } from './scroll-area'

const meta = { title: 'ui/ScrollArea', component: ScrollArea } satisfies Meta<typeof ScrollArea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <ScrollArea className="h-40 w-64 rounded-md border">
      <ol className="p-3 text-sm" tabIndex={0} aria-label="Lines">
        {Array.from({ length: 30 }, (_, i) => (
          <li key={i}>Line {i + 1}</li>
        ))}
      </ol>
    </ScrollArea>
  ),
}
