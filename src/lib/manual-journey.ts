import { tokenize, type ManualResult } from './manual-core.mjs'
import { writeState, type ManualUrlState } from './manual-state.mjs'

/** Preserve original bytes in each span; normalise only for matching, as the demo does. */
export function sourceFragments(text: string, terms: readonly string[]) {
  const selected = new Set(terms), fragments: { text: string; matched: boolean }[] = []
  let offset = 0
  for (const match of text.matchAll(/[\p{L}\p{N}]+/gu)) {
    if (match.index! > offset) fragments.push({ text: text.slice(offset, match.index), matched: false })
    fragments.push({ text: match[0], matched: selected.has(tokenize(match[0])[0]) })
    offset = match.index! + match[0].length
  }
  if (offset < text.length) fragments.push({ text: text.slice(offset), matched: false })
  return fragments
}
export function sourceFragment(manualId: string, sectionId: string) { return `source-${manualId}.${sectionId}` }
export function demoSourceUrl(result: Pick<ManualResult, 'manualId' | 'sectionId'>, state: ManualUrlState) {
  const url = new URL(writeState('https://portfolio.invalid/demos/technical-manual-search/', state))
  url.hash = sourceFragment(result.manualId, result.sectionId)
  return url.pathname + url.search + url.hash
}
