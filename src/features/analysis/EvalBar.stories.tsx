import type { Meta, StoryObj } from '@storybook/react-vite'
import { EvalBar } from './EvalBar'

const meta = {
  title: 'features/analysis/EvalBar',
  component: EvalBar,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-80 max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EvalBar>

export default meta
type Story = StoryObj<typeof meta>

export const NoEvaluation: Story = {}

export const Equal: Story = { args: { score: { kind: 'cp', cp: 0 }, label: '0.00' } }

export const WhiteBetter: Story = { args: { score: { kind: 'cp', cp: 150 }, label: '+1.50' } }

export const BlackBetter: Story = { args: { score: { kind: 'cp', cp: -420 }, label: '-4.20' } }

export const WhiteMates: Story = {
  args: { score: { kind: 'mate', winner: 'white', moves: 3 }, label: '#3' },
}

export const BlackMates: Story = {
  args: { score: { kind: 'mate', winner: 'black', moves: 2 }, label: '#-2' },
}
