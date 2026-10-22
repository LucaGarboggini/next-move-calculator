import type { Meta, StoryObj } from '@storybook/react-vite'
import { FenPgnField } from './FenPgnField'
import { StoryDocument } from './StoryDocument'

const meta = {
  title: 'features/editor/FenPgnField',
  component: FenPgnField,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-80 max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FenPgnField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <StoryDocument>
      <FenPgnField />
    </StoryDocument>
  ),
}

export const AfterAPgn: Story = {
  render: () => (
    <StoryDocument text="1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 *">
      <FenPgnField />
    </StoryDocument>
  ),
}
