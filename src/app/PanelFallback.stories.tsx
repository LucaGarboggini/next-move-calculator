import type { Meta, StoryObj } from '@storybook/react-vite'
import { PanelFallback } from './PanelFallback'

const meta = {
  title: 'app/PanelFallback',
  component: PanelFallback,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof PanelFallback>

export default meta

/** Shown in the panel area while a lazily loaded panel's code arrives. */
export const Loading: StoryObj<typeof meta> = {}
