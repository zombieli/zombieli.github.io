import { search } from './manual-core.mjs';

export function evaluate(index, queries, k = 5) {
  if (!Number.isInteger(k) || k < 1 || k > 50) throw new TypeError('Evaluation cutoff must be from 1 to 50.');
  if (!Array.isArray(queries) || !queries.length || queries.length > 1000) throw new TypeError('Provide 1 to 1000 labelled queries.');
  const ids = new Set(), references = new Set(index.references), rows = [];
  for (const q of queries) {
    if (!q || typeof q.id !== 'string' || !/^[a-z0-9-]+$/.test(q.id) || ids.has(q.id)) throw new TypeError('Query IDs must be unique stable IDs.');
    ids.add(q.id);
    if (!['positive', 'negative', 'unanswerable'].includes(q.kind) || typeof q.query !== 'string' || !Array.isArray(q.relevant)) throw new TypeError('Invalid query judgement.');
    if (new Set(q.relevant).size !== q.relevant.length || q.relevant.some(ref => !references.has(ref))) throw new TypeError('Judgements must use unique known source references.');
    if ((q.kind === 'positive') !== (q.relevant.length > 0)) throw new TypeError('Positive queries need relevance labels; negative queries must have none.');
    const ranked = search(index, q.query, { ...q.filters, limit: 50 });
    const found = ranked.findIndex(result => q.relevant.includes(result.reference));
    const atK = ranked.slice(0, k).map(result => result.reference);
    const relevantAtK = atK.filter(reference => q.relevant.includes(reference)).length;
    rows.push({ id: q.id, kind: q.kind, query: q.query, relevant: q.relevant, returned: ranked.map(result => result.reference),
      firstRelevantRank: found < 0 ? null : found + 1,
      reciprocalRank: q.kind === 'positive' ? (found < 0 ? 0 : 1 / (found + 1)) : null,
      recallAtK: q.kind === 'positive' ? relevantAtK / q.relevant.length : null,
      hitAtK: q.kind === 'positive' ? Number(relevantAtK > 0) : null,
      falsePositive: q.kind === 'positive' ? null : ranked.length > 0 });
  }
  const positive = rows.filter(row => row.kind === 'positive'), negative = rows.filter(row => row.kind !== 'positive');
  const average = key => positive.length ? positive.reduce((sum, row) => sum + row[key], 0) / positive.length : null;
  const falseCount = negative.filter(row => row.falsePositive).length;
  return { schemaVersion: 1, k, rankDepth: 50, totalQueries: rows.length,
    positive: { count: positive.length, mrr: average('reciprocalRank'), recallAtK: average('recallAtK'), hitAtK: average('hitAtK'), missesAtK: positive.filter(row => !row.hitAtK).map(row => row.id) },
    negative: { count: negative.length, emptyResultCount: negative.length - falseCount, falsePositiveCount: falseCount,
      emptyResultRate: negative.length ? (negative.length - falseCount) / negative.length : null,
      falsePositiveRate: negative.length ? falseCount / negative.length : null }, rows };
}
