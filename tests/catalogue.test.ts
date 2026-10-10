import { test } from 'node:test'
import assert from 'node:assert/strict'
import { selectFeatured, filterProjects, readFilters, filterQuery, categoryCount } from '../src/lib/catalogue.ts'
import type { Category, Project } from '../src/lib/catalogue.ts'
const categories: Category[] = [
  { id: 'web', label: 'Web applications', description: '', featuredProjectId: 'older', ideas: [] },
  { id: 'data', label: 'Data & simulation', description: '', featuredProjectId: null, ideas: [] },
  { id: 'mobile', label: 'Mobile applications', description: '', featuredProjectId: null, ideas: [] },
]
const project = (id: string, categoryId: string, updatedAt: string, status: Project['status'] = 'published'): Project => ({
  id, categoryId, title: id, updatedAt, publishedAt: '2026-10-01', status,
  summary: 'Engineering evidence', technologies: ['Python'], tags: ['testing'], proof: 'Test results',
  cover: { src: '/cover.svg', alt: 'Diagram', fit: 'contain' }, renderer: 'standard', links: [],
})
const projects = [project('older', 'web', '2026-10-02'), project('newer', 'web', '2026-10-10'), project('beta', 'data', '2026-10-10'), project('alpha', 'data', '2026-10-10'), project('private-draft', 'mobile', '2026-10-10', 'draft'), project('retired', 'data', '2026-10-10', 'archived')]
test('homepage selects one published work per nonempty category, preserves category order and honours pin', () => {
  const actual = selectFeatured(categories, projects)
  assert.deepEqual(actual.map(item => [item.category.id, item.project.id]), [['web', 'older'], ['data', 'alpha']])
  assert.equal(new Set(actual.map(item => item.project.id)).size, actual.length)
})
test('unpinning picks the most recently updated project with a stable tie break', () => {
  assert.equal(selectFeatured([{ ...categories[0], featuredProjectId: null }], projects)[0].project.id, 'newer')
  assert.equal(selectFeatured([categories[1]], [...projects].reverse())[0].project.id, 'alpha')
})
test('publishing the first project in a future category automatically adds a homepage representative', () => {
  const next = [...projects, project('inspection-app', 'mobile', '2026-10-11')]
  assert.deepEqual(selectFeatured(categories, next).map(item => item.category.id), ['web', 'data', 'mobile'])
  assert.equal(categoryCount(projects, 'mobile'), 0)
  assert.equal(categoryCount(next, 'mobile'), 1)
})
test('adding another work in a populated category does not add another homepage card', () => {
  const next = [...projects, project('third', 'web', '2026-10-12')]
  assert.equal(selectFeatured(categories, next).length, 2)
  assert.equal(categoryCount(next, 'web'), 3)
})
test('search combines category, technologies and multiple case-insensitive tokens', () => {
  assert.deepEqual(filterProjects(projects, categories, { category: 'web', q: ' PYTHON   web ', sort: 'title' }).map(p => p.id), ['newer', 'older'])
  assert.equal(filterProjects(projects, categories, { category: 'web', q: 'simulation', sort: 'updated' }).length, 0)
})
test('search normalises full-width text and never returns drafts or archived work', () => {
  assert.equal(filterProjects(projects, categories, { category: 'all', q: 'ＰＹＴＨＯＮ', sort: 'title' }).length, 4)
  assert.deepEqual(filterProjects(projects, categories, { category: 'all', q: 'private-draft', sort: 'updated' }), [])
})
test('sort ordering and filtering do not mutate input data', () => {
  const before = structuredClone(projects)
  assert.deepEqual(filterProjects(projects, categories, { category: 'all', q: '', sort: 'updated' }).map(p => p.id), ['alpha', 'beta', 'newer', 'older'])
  selectFeatured(categories, projects)
  assert.deepEqual(projects, before)
})
test('shareable filters round-trip special characters and keep default URLs clean', () => {
  const filters = { category: 'data', q: 'C++ & data / résumé', sort: 'title' as const }
  assert.deepEqual(readFilters(filterQuery(filters), categories), { filters, unknownCategory: false })
  assert.equal(filterQuery({ category: 'all', q: '', sort: 'updated' }), '')
})
test('unknown categories and sort options fall back safely while preserving search', () => {
  assert.deepEqual(readFilters('?category=removed&q=python&sort=invalid', categories), { filters: { category: 'all', q: 'python', sort: 'updated' }, unknownCategory: true })
})
