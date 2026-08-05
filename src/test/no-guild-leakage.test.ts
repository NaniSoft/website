import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// Source-text guard enforcing the hard vendoring constraint: no occurrence of
// the forbidden brand string "guild" (case-insensitive) and no `@theguild/*`
// import may appear in our vendored source. This is a source contract, not
// rendered behaviour, so the lowest viable seam is the source text itself.
//
// Scope: `.ts`/`.tsx` under `src/` — where component brand strings and imports
// live. Scans all of `src/` (the throwaway `prototype-*` routes were deleted
// once the real surfaces landed; nothing is excluded by path). The only
// exclusion is:
//  - this guard file itself — a guard scanning its own source, which naturally
//    contains the literals it checks for, is nonsensical.

const testFile = fileURLToPath(import.meta.url)
const srcDir = path.resolve(path.dirname(testFile), '..')

function walk(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) {
      out.push(...walk(full))
    }
    else if (/\.(?:ts|tsx)$/.test(entry)) {
      out.push(full)
    }
  }
  return out
}

interface Offender {
  file: string
  matches: string[]
}

const offenders: Offender[] = []
for (const file of walk(srcDir)) {
  const rel = path.relative(srcDir, file).replace(/\\/g, '/')
  if (file === testFile) {
    continue
  }
  const content = readFileSync(file, 'utf8')
  const matches: string[] = []
  if (/guild/i.test(content)) {
    matches.push('guild')
  }
  if (content.includes('@theguild/')) {
    matches.push('@theguild/')
  }
  if (matches.length > 0) {
    offenders.push({ file: rel, matches })
  }
}

describe('no brand leakage in src', () => {
  it('contains no forbidden brand string and no @theguild/* import', () => {
    if (offenders.length > 0) {
      throw new Error(
        `Found forbidden brand leakage in src/:\n${
          offenders.map(o => `  ${o.file}: ${o.matches.join(', ')}`).join('\n')}`,
      )
    }
    expect(offenders).toHaveLength(0)
  })
})
