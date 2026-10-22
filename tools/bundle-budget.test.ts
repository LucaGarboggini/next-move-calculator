// @vitest-environment node
import { checkBudget, initialAssets } from './bundle-budget.ts'

const html = `<!doctype html><html><head>
<script>window.x = 1</script>
<script type="module" crossorigin src="/assets/index-a.js"></script>
<link rel="modulepreload" crossorigin href="/assets/vendor-b.js">
<link rel="stylesheet" crossorigin href="/assets/index-c.css">
<link rel="icon" href="/favicon.svg">
</head></html>`

describe('bundle budget', () => {
  it('lists eagerly loaded scripts, preloads and styles only', () => {
    expect(initialAssets(html)).toEqual([
      '/assets/index-a.js',
      '/assets/vendor-b.js',
      '/assets/index-c.css',
    ])
  })

  it('passes within the budget', () => {
    const report = checkBudget({ html, gzipSize: () => 1000, budgetBytes: 5000 })
    expect(report.totalBytes).toBe(3000)
    expect(report.problems).toEqual([])
  })

  it('fails over the budget', () => {
    const report = checkBudget({ html, gzipSize: () => 1000, budgetBytes: 2000 })
    expect(report.problems).toHaveLength(1)
  })

  it('fails when the engine loads with the page', () => {
    const eager = `<script type="module" src="/assets/a.js"></script><link rel="modulepreload" href="/engine/stockfish-19.wasm">`
    const report = checkBudget({ html: eager, gzipSize: () => 1 })
    expect(report.problems.join()).toContain('on demand')
  })

  it('fails on an empty page', () => {
    expect(checkBudget({ html: '', gzipSize: () => 0 }).problems).toHaveLength(1)
  })
})
