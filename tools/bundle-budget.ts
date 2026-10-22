// Pure helpers for the bundle budget (see docs/adr/0011-hardening-performance.md).

/** Budget for what the browser must download before the app is usable (gzip, JS + CSS). */
export const INITIAL_BUDGET_BYTES = 250 * 1024

export interface BudgetInput {
  /** Contents of dist/index.html. */
  readonly html: string
  /** Gzip size of a file under dist/, by the path used in the HTML (e.g. "/assets/a.js"). */
  readonly gzipSize: (path: string) => number
  readonly budgetBytes?: number
}

export interface BudgetReport {
  readonly files: readonly { readonly path: string; readonly bytes: number }[]
  readonly totalBytes: number
  readonly budgetBytes: number
  readonly problems: readonly string[]
}

/** Assets the HTML loads eagerly: scripts, modulepreloads and stylesheets. */
export function initialAssets(html: string): string[] {
  const found = new Set<string>()
  for (const tag of html.matchAll(/<(?:script|link)\b[^>]*>/g)) {
    const text = tag[0]
    const isScript = text.startsWith('<script')
    const rel = /\brel="([^"]+)"/.exec(text)?.[1]
    if (!isScript && rel !== 'modulepreload' && rel !== 'stylesheet') continue
    const path = /\b(?:src|href)="([^"]+)"/.exec(text)?.[1]
    if (path?.startsWith('/')) found.add(path)
  }
  return [...found]
}

export function checkBudget({
  html,
  gzipSize,
  budgetBytes = INITIAL_BUDGET_BYTES,
}: BudgetInput): BudgetReport {
  const files = initialAssets(html).map((path) => ({ path, bytes: gzipSize(path) }))
  const totalBytes = files.reduce((sum, f) => sum + f.bytes, 0)
  const problems: string[] = []
  if (files.length === 0) problems.push('index.html loads no assets: was the app built?')
  if (totalBytes > budgetBytes) {
    problems.push(`Initial load is ${totalBytes} B gzip, over the ${budgetBytes} B budget.`)
  }
  for (const { path } of files) {
    if (path.includes('/engine/') || path.endsWith('.wasm')) {
      problems.push(`${path} must load on demand, not with the page.`)
    }
  }
  return { files, totalBytes, budgetBytes, problems }
}
