/** Public types for the unmodified Technical Manual Search core. */
export type Manual = { id: string; title: string; category: string; revision: string; sections: { id: string; title: string; text: string }[] }
export type ManualIndex = { readonly sectionCount: number; readonly references: readonly string[]; readonly manuals: readonly Readonly<Omit<Manual, 'sections'>>[]; readonly categories: readonly string[] }
export type ManualResult = { manualId: string; manualTitle: string; category: string; revision: string; sectionId: string; sectionTitle: string; sourceText: string; reference: string; score: number; matchedTerms: string[]; queryTermCount: number; excerpt: string }
export const MAX_QUERY_LENGTH: number
export function tokenize(text: string): string[]
export function validateCorpus(corpus: unknown): Manual[]
export function buildIndex(corpus: unknown): ManualIndex
export function search(index: ManualIndex, query: string, options?: { manual?: string; category?: string; limit?: number }): ManualResult[]
export function excerpt(text: string, terms: string[], maxLength?: number): string
