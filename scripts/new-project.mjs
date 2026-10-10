import { existsSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadCatalogue } from './catalogue.mjs'
const root = resolve(import.meta.dirname, '..')
const [id, categoryId, ...extra] = process.argv.slice(2)
if (!id || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(id) || !categoryId || extra.length) throw new Error('Usage: npm run project:new -- project-slug category-id')
const { categories } = loadCatalogue(root)
if (!categories.some(c => c.id === categoryId)) throw new Error(`Choose a category: ${categories.map(c => c.id).join(', ')}`)
const file = resolve(root, `content/projects/${id}.json`)
if (existsSync(file)) throw new Error(`Project already exists: ${id}`)
const today = new Date().toISOString().slice(0, 10)
const project = {
  id, title: 'Draft: replace with project title', categoryId, status: 'draft', publishedAt: today, updatedAt: today,
  summary: '', technologies: [], tags: [], proof: '', cover: { src: '', alt: '', fit: 'contain' }, renderer: 'standard', links: [],
  caseStudy: { role: '', context: '', sections: ['Problem', 'Implementation and decisions', 'Verification and results', 'Reproduce the work'].map(heading => ({ heading, paragraphs: [''], bullets: [] })), limitations: [''] }
}
writeFileSync(file, JSON.stringify(project, null, 2) + '\n', { flag: 'wx' })
console.log(`Created draft: ${file}\nFill the content and evidence, set publication dates, then change status to published. Drafts are excluded from the public catalogue.`)
