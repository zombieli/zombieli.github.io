export function readState(location) {
  const url = new URL(location);
  return { query: url.searchParams.get('q') ?? '', manual: url.searchParams.get('manual') ?? '', category: url.searchParams.get('category') ?? '' };
}
export function writeState(location, state) {
  const url = new URL(location);
  for (const [key, value] of [['q', state.query], ['manual', state.manual], ['category', state.category]]) {
    if (value) url.searchParams.set(key, value); else url.searchParams.delete(key);
  }
  url.hash = '';
  return url.href;
}
