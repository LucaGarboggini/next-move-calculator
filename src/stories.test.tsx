import { readdirSync } from 'node:fs'
import { composeStories } from '@storybook/react-vite'
import type { Meta } from '@storybook/react-vite'
import { cleanup, render } from '@testing-library/react'
import type { ComponentType } from 'react'
import { TooltipProvider } from '@/ui'

type StoriesModule = { default: Meta } & Record<string, unknown>

const modules = import.meta.glob<StoriesModule>('./**/*.stories.tsx', { eager: true })

const THEMES = ['light', 'dark'] as const

describe('stories', () => {
  afterEach(() => {
    cleanup()
    document.documentElement.classList.remove('dark')
  })

  it('exist for every ui primitive', () => {
    const dir = 'src/ui/primitives'
    const primitives = readdirSync(dir)
      .filter((f) => f.endsWith('.tsx') && !/\.(test|stories)\.tsx$/.test(f))
      .map((f) => f.replace('.tsx', ''))
    const withStories = new Set(
      readdirSync(dir)
        .filter((f) => f.endsWith('.stories.tsx'))
        .map((f) => f.replace('.stories.tsx', '')),
    )
    expect(primitives.filter((p) => !withStories.has(p))).toEqual([])
  })

  describe.each(Object.entries(modules))('%s', (_path, mod) => {
    const stories = composeStories(mod as never) as Record<string, ComponentType>
    it.each(THEMES)('renders every story in the %s theme', (theme) => {
      document.documentElement.classList.toggle('dark', theme === 'dark')
      expect(Object.keys(stories).length).toBeGreaterThan(0)
      for (const Story of Object.values(stories)) {
        const { unmount, container } = render(
          <TooltipProvider>
            <Story />
          </TooltipProvider>,
        )
        expect(container.ownerDocument.body.textContent).not.toBeNull()
        unmount()
      }
    })
  })
})
