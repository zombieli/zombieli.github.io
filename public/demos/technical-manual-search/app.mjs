import { buildIndex, search, tokenize } from './core.mjs';
import { readState, writeState } from './state.mjs';

const $ = id => document.getElementById(id);
const form = $('search-form'), query = $('search-query'), manual = $('manual-filter'), category = $('category-filter');
const results = $('results'), status = $('search-status'), count = $('result-count');
let index;

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

// Source and query text never pass through an HTML parser.
function highlight(element, text, terms) {
  const selected = new Set(terms);
  let offset = 0;
  for (const match of text.matchAll(/[\p{L}\p{N}]+/gu)) {
    element.append(document.createTextNode(text.slice(offset, match.index)));
    const token = tokenize(match[0])[0];
    element.append(selected.has(token) ? node('mark', '', match[0]) : document.createTextNode(match[0]));
    offset = match.index + match[0].length;
  }
  element.append(document.createTextNode(text.slice(offset)));
}

function empty(title, description) {
  const box = node('div', 'empty-state');
  box.append(node('span', 'empty-symbol', '⌕'), node('h3', '', title), node('p', '', description));
  results.append(box);
}

function resultCard(result, rank) {
  const article = node('article', 'result');
  article.id = `source-${result.manualId}.${result.sectionId}`;
  const meta = node('div', 'result-meta');
  meta.append(node('span', '', `${result.manualTitle} / ${result.category}`), node('span', 'rank', `MATCH ${String(rank).padStart(2, '0')}`));
  const excerpt = node('p', 'excerpt'); highlight(excerpt, result.excerpt, result.matchedTerms);
  const attribution = node('div', 'result-reference');
  const link = node('a', 'reference-link', result.reference);
  link.href = `#${article.id}`;
  attribution.append(link, node('span', '', `Revision ${result.revision}`), node('span', '', `${result.matchedTerms.length}/${result.queryTermCount} terms matched`));
  const details = node('details', '');
  const paragraph = node('p', 'source-text'); highlight(paragraph, result.sourceText, result.matchedTerms);
  details.append(node('summary', '', 'Read complete source section'), node('p', 'source-heading', `${result.manualTitle} · ${result.sectionTitle} · ${result.reference}`), paragraph);
  link.addEventListener('click', () => { details.open = true; });
  article.append(meta, node('h3', '', result.sectionTitle), excerpt, attribution, details);
  return article;
}

function render(state) {
  results.replaceChildren(); status.className = '';
  try {
    const matches = search(index, state.query, { manual: state.manual, category: state.category });
    count.textContent = state.query.trim() ? `${matches.length} matching section${matches.length === 1 ? '' : 's'}` : `${index.sectionCount} sections indexed`;
    if (!state.query.trim()) {
      status.textContent = `${index.manuals.length} manuals ready to explore. Choose a topic or enter a search.`;
      empty('Your next reference is here.', 'Start with a task, a component, or a procedure. Search uses exact words; try “battery” rather than “power pack”.');
    } else if (!matches.length) {
      status.textContent = `No lexical matches for “${state.query}”.`;
      empty('No matching sections.', 'Try a shorter term, check the spelling, or broaden the selected manual and category. This collection may not contain the information you need.');
    } else {
      status.textContent = `Results for “${state.query}” · ordered by lexical relevance. Scores are not answer confidence.`;
      matches.forEach((result, position) => results.append(resultCard(result, position + 1)));
      const target = document.getElementById(location.hash.slice(1));
      if (target?.classList.contains('result')) { target.querySelector('details').open = true; target.scrollIntoView(); }
    }
  } catch (error) {
    count.textContent = 'Search needs attention'; status.className = 'error';
    status.textContent = `${error.message} Choose a valid filter or edit the query, then search again.`;
    empty('Adjust your search.', 'The previous results have been cleared. Your query remains available for editing.');
  }
}

function setSelection(select, value) {
  select.querySelectorAll('[data-invalid]').forEach(option => option.remove());
  if (value && ![...select.options].some(option => option.value === value)) {
    const option = node('option', '', `Unknown: ${value}`); option.value = value; option.dataset.invalid = 'true'; select.append(option);
  }
  select.value = value;
}

function restore() {
  const state = readState(location.href);
  query.value = state.query; setSelection(manual, state.manual); setSelection(category, state.category);
  if (index) render(state);
}

function submit() {
  if (!index) return;
  const state = { query: query.value, manual: manual.value, category: category.value };
  const url = writeState(location.href, state);
  if (url !== location.href) history.pushState(null, '', url);
  render(state);
}

form.addEventListener('submit', event => { event.preventDefault(); submit(); });
document.querySelectorAll('[data-query]').forEach(button => button.addEventListener('click', () => { query.value = button.dataset.query; manual.value = ''; category.value = ''; submit(); }));
window.addEventListener('popstate', restore);

try {
  const response = await fetch('./data/manuals.json');
  if (!response.ok) throw new Error('The training collection could not be loaded.');
  index = buildIndex(await response.json());
  for (const m of index.manuals) {
    const option = node('option', '', m.title); option.value = m.id; manual.append(option);
    const item = node('div', 'library-item');
    item.append(node('span', 'library-number', String(index.manuals.indexOf(m) + 1).padStart(2, '0')), node('p', 'library-title', m.title), node('p', 'library-category', m.category));
    $('library-list').append(item);
  }
  for (const value of index.categories) { const option = node('option', '', value); option.value = value; category.append(option); }
  restore();
} catch (error) {
  status.textContent = `${error.message} Reload the page to try again.`; status.className = 'error'; count.textContent = 'Collection unavailable';
  form.querySelectorAll('input,select,button').forEach(control => { control.disabled = true; });
  document.querySelectorAll('[data-query]').forEach(button => { button.disabled = true; });
}
