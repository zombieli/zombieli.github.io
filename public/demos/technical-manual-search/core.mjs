export const MAX_QUERY_LENGTH = 240;
const STOP = new Set('a an and are as at be before by for from in is it of on or that the this to with your'.split(' '));
const indexes = new WeakMap();
const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;

export function tokenize(text) {
  if (typeof text !== 'string') throw new TypeError('Text must be a string.');
  return (text.normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).filter(term => !STOP.has(term));
}

function field(value, name, max = 160) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new TypeError(`${name} must be non-empty text up to ${max} characters.`);
}
function id(value, name) {
  field(value, name, 64);
  if (!/^[a-z][a-z0-9-]*$/.test(value)) throw new TypeError(`${name} must use a lowercase stable ID.`);
}

export function validateCorpus(corpus) {
  if (!Array.isArray(corpus) || corpus.length < 1 || corpus.length > 100) throw new TypeError('Corpus must contain 1 to 100 manuals.');
  const manualIds = new Set();
  let total = 0;
  for (const manual of corpus) {
    if (!manual || typeof manual !== 'object') throw new TypeError('Invalid manual.');
    id(manual.id, 'Manual ID');
    if (manualIds.has(manual.id)) throw new TypeError(`Duplicate manual ID: ${manual.id}`);
    manualIds.add(manual.id);
    field(manual.title, 'Manual title'); field(manual.category, 'Category', 80); field(manual.revision, 'Revision', 40);
    if (!Array.isArray(manual.sections) || !manual.sections.length || manual.sections.length > 100) throw new TypeError('Manual must contain 1 to 100 sections.');
    const sectionIds = new Set();
    for (const section of manual.sections) {
      if (!section || typeof section !== 'object') throw new TypeError('Invalid section.');
      id(section.id, 'Section ID');
      if (sectionIds.has(section.id)) throw new TypeError(`Duplicate section ID: ${manual.id}#${section.id}`);
      sectionIds.add(section.id);
      field(section.title, 'Section title'); field(section.text, 'Section text', 20000);
      if (++total > 2000) throw new TypeError('Corpus exceeds 2000 sections.');
    }
  }
  return corpus;
}

export function buildIndex(corpus) {
  validateCorpus(corpus);
  const docs = [], df = new Map();
  for (const manual of corpus) for (const section of manual.sections) {
    // Repeating the section heading provides a small, explicit title weight.
    const terms = tokenize(`${manual.title} ${section.title} ${section.title} ${section.text}`);
    const frequencies = new Map();
    terms.forEach(term => frequencies.set(term, (frequencies.get(term) ?? 0) + 1));
    frequencies.forEach((_, term) => df.set(term, (df.get(term) ?? 0) + 1));
    docs.push({ manualId: manual.id, manualTitle: manual.title, category: manual.category, revision: manual.revision,
      sectionId: section.id, sectionTitle: section.title, sourceText: section.text, reference: `${manual.id}#${section.id}`,
      frequencies, length: terms.length });
  }
  docs.sort((a, b) => compare(a.reference, b.reference));
  const index = Object.freeze({ sectionCount: docs.length, references: Object.freeze(docs.map(doc => doc.reference)),
    manuals: Object.freeze(corpus.map(m => Object.freeze({ id: m.id, title: m.title, category: m.category, revision: m.revision })).sort((a, b) => compare(a.id, b.id))),
    categories: Object.freeze([...new Set(corpus.map(m => m.category))].sort(compare)) });
  indexes.set(index, { docs, df, averageLength: docs.reduce((sum, doc) => sum + doc.length, 0) / docs.length || 1 });
  return index;
}

export function search(index, query, { manual = '', category = '', limit = 20 } = {}) {
  const data = indexes.get(index);
  if (!data) throw new TypeError('Use an index created by buildIndex.');
  if (typeof query !== 'string') throw new TypeError('Query must be a string.');
  if (query.length > MAX_QUERY_LENGTH) throw new RangeError(`Query must be ${MAX_QUERY_LENGTH} characters or fewer.`);
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw new RangeError('Result limit must be between 1 and 50.');
  if (typeof manual !== 'string' || (manual && !index.manuals.some(m => m.id === manual))) throw new TypeError('Unknown manual filter.');
  if (typeof category !== 'string' || (category && !index.categories.includes(category))) throw new TypeError('Unknown category filter.');
  const terms = [...new Set(tokenize(query))].sort(compare);
  if (terms.length > 64) throw new RangeError('Query must contain 64 unique terms or fewer.');
  const results = [];
  for (const doc of data.docs) {
    if ((manual && manual !== doc.manualId) || (category && category !== doc.category)) continue;
    let score = 0;
    const matchedTerms = [];
    for (const term of terms) {
      const tf = doc.frequencies.get(term) ?? 0;
      if (!tf) continue;
      matchedTerms.push(term);
      const idf = Math.log(1 + (data.docs.length - data.df.get(term) + 0.5) / (data.df.get(term) + 0.5));
      score += idf * (tf * 2.2) / (tf + 1.2 * (0.25 + 0.75 * doc.length / data.averageLength));
    }
    if (!matchedTerms.length) continue;
    const { frequencies, length, ...source } = doc;
    results.push({ ...source, score, matchedTerms, queryTermCount: terms.length, excerpt: excerpt(doc.sourceText, matchedTerms) });
  }
  return results.sort((a, b) => b.score - a.score || compare(a.reference, b.reference)).slice(0, limit);
}

export function excerpt(text, terms, maxLength = 220) {
  if (typeof text !== 'string' || !Array.isArray(terms) || !Number.isInteger(maxLength) || maxLength < 20 || maxLength > 1000) throw new TypeError('Invalid excerpt arguments.');
  if (text.length <= maxLength) return text;
  const lower = text.toLowerCase();
  const positions = terms.map(term => lower.indexOf(term)).filter(position => position >= 0);
  const first = positions.length ? Math.min(...positions) : 0;
  let start = Math.max(0, Math.min(text.length - maxLength, first - Math.floor(maxLength / 3)));
  if (start > 0) {
    const boundary = text.indexOf(' ', start);
    if (boundary >= 0 && boundary < first) start = boundary + 1;
  }
  const end = Math.min(text.length, start + maxLength);
  return `${start ? '… ' : ''}${text.slice(start, end).trim()}${end < text.length ? ' …' : ''}`;
}
