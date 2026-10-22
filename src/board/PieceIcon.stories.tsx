import type { Meta, StoryObj } from '@storybook/react-vite'
import { ROLES } from '@/core'
import { PieceIcon } from './PieceIcon'
import { PIECE_THEMES } from './themes'

const meta = {
  title: 'board/PieceIcon',
  component: PieceIcon,
  args: { piece: { color: 'white', role: 'knight' }, className: 'size-16' },
} satisfies Meta<typeof PieceIcon>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const AllPieces: Story = {
  render: () => (
    <div className="flex flex-col gap-3 rounded-md bg-board-light p-3">
      {PIECE_THEMES.map((theme) =>
        (['white', 'black'] as const).map((color) => (
          <div
            key={`${theme}-${color}`}
            className="flex gap-1 bg-board-dark"
            title={`${theme} ${color}`}
          >
            {ROLES.map((role) => (
              <PieceIcon
                key={role}
                piece={{ color, role }}
                pieceTheme={theme}
                className="size-12"
              />
            ))}
          </div>
        )),
      )}
    </div>
  ),
}
