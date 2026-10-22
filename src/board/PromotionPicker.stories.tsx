import type { Meta, StoryObj } from '@storybook/react-vite'
import { PromotionPicker } from './PromotionPicker'

const meta = {
  title: 'board/PromotionPicker',
  component: PromotionPicker,
  args: { color: 'white', onChoose: () => {}, onCancel: () => {} },
  decorators: [
    (Story) => (
      <div className="relative aspect-square w-96 max-w-full overflow-hidden rounded-md bg-board-dark">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PromotionPicker>

export default meta
type Story = StoryObj<typeof meta>

export const White: Story = {}

export const Black: Story = { args: { color: 'black' } }

export const GlyphPieces: Story = { args: { pieceTheme: 'glyph' } }
