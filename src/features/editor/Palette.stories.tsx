import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEditorStore, type EditorTool } from '@/state'
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

/** The palette with `tool` already picked. */
function PaletteWith({ tool }: { tool: EditorTool }) {
  useState(() => useEditorStore.getState().setTool(tool))
  return <Palette />
}

export const Default: Story = {
  render: () => (
    <StoryDocument>
      <Palette />
    </StoryDocument>
  ),
}

/** A spare piece is picked: taps on the board place it until another tool is chosen. */
export const PiecePicked: Story = {
  render: () => (
    <StoryDocument>
      <PaletteWith tool={{ kind: 'place', piece: { color: 'black', role: 'knight' } }} />
    </StoryDocument>
  ),
}

export const Erasing: Story = {
  render: () => (
    <StoryDocument>
      <PaletteWith tool={{ kind: 'erase' }} />
    </StoryDocument>
  ),
}
