import type { Meta, StoryObj } from '@storybook/react-vite'
import { Palette } from './Palette'
import { StoryDocument } from './StoryDocument'

const meta = {
  title: 'features/editor/Palette',
  component: Palette,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-80 max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Palette>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <StoryDocument>
      <Palette />
    </StoryDocument>
  ),
}
