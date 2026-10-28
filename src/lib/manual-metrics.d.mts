import type { ManualIndex } from './manual-core.mjs'
export type ManualJudgement = { id: string; kind: string; query: string; relevant: string[]; filters?: { manual?: string; category?: string } }
export type ManualEvaluationRow = { id: string; kind: string; query: string; relevant: string[]; returned: string[]; firstRelevantRank: number | null; reciprocalRank: number | null; recallAtK: number | null; hitAtK: number | null; falsePositive: boolean | null }
export type ManualEvaluation = {
  schemaVersion: number; k: number; rankDepth: number; totalQueries: number;
  positive: { count: number; mrr: number | null; recallAtK: number | null; hitAtK: number | null; missesAtK: string[] };
  negative: { count: number; emptyResultCount: number; falsePositiveCount: number; emptyResultRate: number | null; falsePositiveRate: number | null };
  rows: ManualEvaluationRow[];
}
export function evaluate(index: ManualIndex, queries: ManualJudgement[], k?: number): ManualEvaluation
