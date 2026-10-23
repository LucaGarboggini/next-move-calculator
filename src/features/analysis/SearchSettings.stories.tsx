import type { Meta, StoryObj } from '@storybook/react-vite'
import type { AnalysisSettings } from '@/state'
import { SearchSettings } from './SearchSettings'
import { StoryAnalysis } from './StoryAnalysis'

const meta = {
  title: 'features/analysis/SearchSettings',
  component: SearchSettings,
  parameters: { layout: 'centered' },
  decorators: [
    (Story, { parameters }) => (
      <StoryAnalysis settings={parameters.analysisSettings as Partial<AnalysisSettings>}>
        <div className="w-96 max-w-full">
          <Story />
        </div>
      </StoryAnalysis>
    ),
  ],
} satisfies Meta<typeof SearchSettings>

export default meta
type Story = StoryObj<typeof meta>

/** A multi-threaded browser on a desktop: threads and a large hash are available. */
export const Desktop: Story = {
  args: {
    limits: {
      bounds: { maxThreads: 8, maxHashMb: 256 },
      recommended: { threads: 7, hashMb: 64 },
    },
  },
}

/** A phone: few threads, small hash. */
export const Phone: Story = {
  args: {
    limits: {
      bounds: { maxThreads: 2, maxHashMb: 64 },
      recommended: { threads: 2, hashMb: 16 },
    },
  },
}

/** Not cross-origin isolated: the engine runs on one thread, so there is no threads control. */
export const SingleThreaded: Story = {
  args: {
    limits: {
      bounds: { maxThreads: 1, maxHashMb: 256 },
      recommended: { threads: 1, hashMb: 64 },
    },
  },
}

const desktop = {
  bounds: { maxThreads: 8, maxHashMb: 256 },
  recommended: { threads: 7, hashMb: 64 },
}

/** Auto-move on: the best move is played when a search reaches its time or depth limit. */
export const AutoMove: Story = {
  args: { limits: desktop },
  parameters: { analysisSettings: { autoMove: true } },
}

/** Auto-move on, but searching until stopped with no depth limit: it explains it needs a limit. */
export const AutoMoveWithoutLimit: Story = {
  args: { limits: desktop },
  parameters: { analysisSettings: { autoMove: true, infinite: true, depth: null } },
}
