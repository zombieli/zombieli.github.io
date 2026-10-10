import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { resolve, sep } from 'node:path'
import { tmpdir } from 'node:os'
import { validateCatalogue, loadCatalogue, prepareCatalogue } from '../scripts/catalogue.mjs'
const categories = [{ id: 'web', label: 'Web applications', description: 'Applications for real workflows.', featuredProjectId: null, ideas: [] }]
const valid = () => ({
  id: 'future-project', title: 'A new project', categoryId: 'web', status: 'published', publishedAt: '2026-10-10', updatedAt: '2026-10-10',
  summary: 'A documented experiment.', technologies: ['TypeScript'], tags: [], proof: 'Recorded verification',
  cover: { src: '/cover.svg', alt: 'System diagram', fit: 'contain' }, renderer: 'standard', links: [{ label: 'Evidence', href: '/report.json' }],
  caseStudy: { role: 'Design and implementation', context: 'Personal project', sections: [{ heading: 'Verification', paragraphs: ['Describe observed results.'] }], limitations: ['Synthetic inputs only.'] },
})
test('drafts can be incomplete but never enter generated catalogue', () => {
  assert.deepEqual(validateCatalogue(categories, [{ id: 'draft', title: 'Private draft', categoryId: 'web', status: 'draft' }]).projects, [])
})
test('published records require real local assets, readable evidence and complete case content', () => {
  assert.throws(() => validateCatalogue(categories, [valid()], () => false), /missing public asset/)
  assert.throws(() => validateCatalogue(categories, [{ ...valid(), links: [] }]), /at least one/)
  assert.throws(() => validateCatalogue(categories, [{ ...valid(), caseStudy: undefined }]), /complete caseStudy/)
  assert.throws(() => validateCatalogue(categories, [{ ...valid(), renderer: undefined }]), /standard renderer/)
  assert.throws(() => validateCatalogue(categories, [{ ...valid(), renderer: 'diagnostics' }]), /standard renderer/)
})
test('rejects missing ids, duplicate identities, unknown categories and malformed dates', () => {
  assert.throws(() => validateCatalogue(categories, [{ ...valid(), id: undefined }]), /project id/)
  assert.throws(() => validateCatalogue(categories, [valid(), valid()]), /duplicate project id/)
  assert.throws(() => validateCatalogue([...categories, ...categories], []), /duplicate category id/)
  assert.throws(() => validateCatalogue(categories, [{ ...valid(), categoryId: 'missing' }]), /unknown category/)
  assert.throws(() => validateCatalogue(categories, [{ ...valid(), updatedAt: '2026-02-30' }]), /invalid dates/)
  assert.throws(() => validateCatalogue(categories, [{ ...valid(), updatedAt: '2026-01-01' }]), /invalid dates/)
})
test('featured pins cannot refer to drafts, missing work or another category', () => {
  const pinned = [{ ...categories[0], featuredProjectId: 'future-project' }]
  assert.throws(() => validateCatalogue(pinned, []), /featured project/)
  assert.throws(() => validateCatalogue(pinned, [{ ...valid(), status: 'draft' }]), /featured project/)
  assert.throws(() => validateCatalogue([...pinned, { ...categories[0], id: 'other' }], [{ ...valid(), categoryId: 'other' }]), /featured project/)
})
test('rejects traversal, protocol-relative and executable URLs', () => {
  for (const href of ['/../secret', '/%2e%2e/secret', '/%5csecret', '//evil.example', 'javascript:alert(1)', 'file:///C:/secret', 'https://user:pass@example.com']) {
    assert.throws(() => validateCatalogue(categories, [{ ...valid(), links: [{ label: 'Bad', href }] }]), /Catalogue:/)
  }
  assert.throws(() => validateCatalogue(categories, [{ ...valid(), id: '../outside' }]), /project id/)
})
test('permits HTTPS evidence and escaped local fragment links', () => {
  const p = valid(); p.links = [{ label: 'Repository', href: 'https://github.com/zombieli/example' }, { label: 'Report', href: '/report.json#result' }]
  assert.equal(validateCatalogue(categories, [p]).projects.length, 1)
})
function fixture(t) {
  const parent = resolve(tmpdir())
  const root = mkdtempSync(resolve(parent, 'leon-catalogue-test-'))
  t.after(() => {
    const checked = resolve(root)
    assert(checked.startsWith(parent + sep + 'leon-catalogue-test-'))
    rmSync(checked, { recursive: true, force: true })
  })
  for (const dir of ['content/projects', 'public', 'projects']) mkdirSync(resolve(root, dir), { recursive: true })
  writeFileSync(resolve(root, 'content/categories.json'), JSON.stringify(categories))
  writeFileSync(resolve(root, 'public/cover.svg'), '<svg/>')
  writeFileSync(resolve(root, 'public/report.json'), '{}')
  return root
}
const saveProject = (root, project) => writeFileSync(resolve(root, `content/projects/${project.id}.json`), JSON.stringify(project))
test('new standard project produces its route, escaped metadata and public data without configuration edits', t => {
  const root = fixture(t); const p = { ...valid(), title: 'A <new> "project"' }; saveProject(root, p)
  saveProject(root, { id: 'secret-draft', title: 'Must not appear', categoryId: 'web', status: 'draft' })
  const entries = prepareCatalogue(root)
  assert.equal(entries['project-future-project'], resolve(root, 'projects/future-project/index.html'))
  const html = readFileSync(entries['project-future-project'], 'utf8')
  assert.match(html, /data-page="standard" data-project="future-project"/)
  assert.match(html, /A &lt;new&gt; &quot;project&quot;/)
  assert(!existsSync(resolve(root, 'projects/secret-draft/index.html')))
  assert(!readFileSync(resolve(root, 'src/data/catalogue.json'), 'utf8').includes('secret-draft'))
})
test('archiving removes owned routes and entries, but keeps unrelated authored pages', t => {
  const root = fixture(t); saveProject(root, valid()); prepareCatalogue(root)
  mkdirSync(resolve(root, 'projects/manual'), { recursive: true }); writeFileSync(resolve(root, 'projects/manual/index.html'), '<h1>Keep me</h1>')
  saveProject(root, { ...valid(), status: 'archived' })
  const entries = prepareCatalogue(root)
  assert(!entries['project-future-project'])
  assert(!existsSync(resolve(root, 'projects/future-project/index.html')))
  assert.equal(readFileSync(resolve(root, 'projects/manual/index.html'), 'utf8'), '<h1>Keep me</h1>')
  assert.deepEqual(JSON.parse(readFileSync(resolve(root, 'src/data/catalogue.json'), 'utf8')).projects, [])
})
test('generation refuses to overwrite an unowned detail page', t => {
  const root = fixture(t); saveProject(root, valid())
  mkdirSync(resolve(root, 'projects/future-project')); writeFileSync(resolve(root, 'projects/future-project/index.html'), 'Existing manual content')
  assert.throws(() => prepareCatalogue(root), /refusing to overwrite/)
  assert.equal(readFileSync(resolve(root, 'projects/future-project/index.html'), 'utf8'), 'Existing manual content')
})
test('loader detects filename drift and missing evidence in an actual content directory', t => {
  const root = fixture(t)
  writeFileSync(resolve(root, 'content/projects/wrong.json'), JSON.stringify(valid()))
  assert.throws(() => loadCatalogue(root), /filename must match/)
})
