import type { Meta, StoryObj } from '@storybook/react-vite'
import { AnalysisPanel } from './AnalysisPanel'
import { SearchSettingsPanel } from './panels'
import { StoryAnalysis } from './StoryAnalysis'
import { MATE_FEN, mateResult, startingResult } from './testing/samples'

const meta = {
  title: 'features/analysis/Panels',
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-96 max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Idle: Story = {
  render: () => (
    <StoryAnalysis>
      <AnalysisPanel />
    </StoryAnalysis>
  ),
}

export const Starting: Story = {
  render: () => (
    <StoryAnalysis status="loading">
      <AnalysisPanel />
    </StoryAnalysis>
  ),
}

/** Output streaming in: Stop is shown, results update in place. */
export const Searching: Story = {
  render: () => (
    <StoryAnalysis status="searching" result={startingResult()}>
      <AnalysisPanel />
    </StoryAnalysis>
  ),
}

export const Completed: Story = {
  render: () => (
    <StoryAnalysis status="completed" result={startingResult()}>
      <AnalysisPanel />
    </StoryAnalysis>
  ),
}

export const ForcedMate: Story = {
  render: () => (
    <StoryAnalysis text={MATE_FEN} status="completed" result={mateResult()}>
      <AnalysisPanel />
    </StoryAnalysis>
  ),
}

export const PausedInBackground: Story = {
  render: () => (
    <StoryAnalysis status="backgrounded" result={startingResult()}>
      <AnalysisPanel />
    </StoryAnalysis>
  ),
}

export const EngineError: Story = {
  render: () => (
    <StoryAnalysis status="error" error="Could not download the engine.">
      <AnalysisPanel />
    </StoryAnalysis>
  ),
}

export const InvalidPosition: Story = {
  render: () => (
    <StoryAnalysis text="4k3/8/8/8/8/8/8/8 w - - 0 1">
      <AnalysisPanel />
    </StoryAnalysis>
  ),
}

export const Checkmate: Story = {
  render: () => (
    <StoryAnalysis text="R5k1/5ppp/8/8/8/8/5PPP/6K1 b - - 1 1">
      <AnalysisPanel />
    </StoryAnalysis>
  ),
}

export const SearchSettings: Story = {
  render: () => (
    <StoryAnalysis>
      <SearchSettingsPanel />
    </StoryAnalysis>
  ),
}
