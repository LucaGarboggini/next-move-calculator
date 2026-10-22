// Fails when the initial load of dist/ is over budget. Run after `npm run build`.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import { checkBudget } from '../tools/bundle-budget.ts'

const dist = join(import.meta.dirname, '..', 'dist')
const html = readFileSync(join(dist, 'index.html'), 'utf8')
const report = checkBudget({
  html,
  gzipSize: (path) => gzipSync(readFileSync(join(dist, path))).length,
})

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} kB`
for (const { path, bytes } of report.files) console.log(`  ${kb(bytes).padStart(9)}  ${path}`)
console.log(`Initial load: ${kb(report.totalBytes)} gzip (budget ${kb(report.budgetBytes)})`)
if (report.problems.length > 0) {
  for (const problem of report.problems) console.error(`✗ ${problem}`)
  process.exit(1)
}
