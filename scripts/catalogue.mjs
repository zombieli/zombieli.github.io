import { existsSync, readFileSync, readdirSync, mkdirSync, writeFileSync, realpathSync, unlinkSync } from 'node:fs'
import { resolve, dirname, sep } from 'node:path'

const fail = message => { throw new Error(`Catalogue: ${message}`) }
const slug = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/
const text = value => typeof value === 'string' && value.trim().length > 0
const strings = values => Array.isArray(values) && values.every(text)
const date = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
const legacy = { 'device-diagnostics': 'diagnostics', 'field-service': 'workflow', scheduling: 'scheduling' }
export function validateCatalogue(categories, projects, assetExists = () => true) {
  if (!Array.isArray(categories) || !categories.length || !Array.isArray(projects)) fail('categories and projects must be arrays; at least one category is required')
  const ids = new Set()
  for (const c of categories) {
    if (typeof c.id !== 'string' || !slug.test(c.id) || c.id === 'all' || ids.has(c.id)) fail(`invalid or duplicate category id: ${c.id}`)
    ids.add(c.id)
    if (![c.label, c.description].every(text) || !strings(c.ideas)) fail(`incomplete category: ${c.id}`)
    if (c.featuredProjectId !== null && !text(c.featuredProjectId)) fail(`featuredProjectId must be an id or null: ${c.id}`)
  }
  const projectIds = new Set()
  const checkLink = (href, context, localOnly = false) => {
    if (typeof href !== 'string' || /[\\\s]/.test(href)) fail(`invalid link in ${context}`)
    if (/^https:\/\//.test(href) && !localOnly) {
      try { const url = new URL(href); if (!url.hostname || url.username || url.password) fail(`unsafe URL: ${href}`) } catch { fail(`invalid URL: ${href}`) }
      return
    }
    if (!href.startsWith('/') || href.startsWith('//')) fail(`use an absolute local path or HTTPS URL in ${context}`)
    let path
    try { path = decodeURIComponent(href.split(/[?#]/)[0]) } catch { fail(`invalid URL encoding: ${href}`) }
    if (path.includes('\\') || path.includes('\0') || path.startsWith('//') || path.split('/').some(part => part === '..' || part === '.')) fail(`unsafe local path: ${href}`)
    if (!assetExists(path)) fail(`missing public asset ${href} in ${context}`)
  }
  for (const p of projects) {
    if (typeof p.id !== 'string' || !slug.test(p.id) || projectIds.has(p.id)) fail(`invalid or duplicate project id: ${p.id}`)
    projectIds.add(p.id)
    if (!ids.has(p.categoryId)) fail(`unknown category ${p.categoryId} in ${p.id}`)
    if (!['draft', 'published', 'archived'].includes(p.status)) fail(`invalid status in ${p.id}`)
    if (!text(p.title)) fail(`title required in ${p.id}`)
    if (p.status !== 'published') continue
    if (!date(p.publishedAt) || !date(p.updatedAt) || p.updatedAt < p.publishedAt) fail(`invalid dates in ${p.id}`)
    if (![p.summary, p.proof].every(text) || !strings(p.technologies) || !p.technologies.length || !strings(p.tags)) fail(`summary, proof and technologies required in ${p.id}`)
    if (!p.cover || !text(p.cover.alt) || !['cover', 'contain'].includes(p.cover.fit)) fail(`complete cover required in ${p.id}`)
    checkLink(p.cover.src, `${p.id} cover`, true)
    if (!Array.isArray(p.links) || !p.links.length) fail(`at least one evidence, demo or source link required in ${p.id}`)
    for (const link of p.links) { if (!text(link.label)) fail(`link label required in ${p.id}`); checkLink(link.href, p.id) }
    if (p.renderer !== 'standard' && (!Object.hasOwn(legacy, p.id) || legacy[p.id] !== p.renderer)) fail(`new projects must use the standard renderer: ${p.id}`)
    if (p.renderer === 'standard') {
      const study = p.caseStudy
      if (!study || ![study.role, study.context].every(text) || !Array.isArray(study.sections) || !study.sections.length || !strings(study.limitations) || !study.limitations.length) fail(`complete caseStudy required in ${p.id}`)
      for (const section of study.sections) if (!text(section.heading) || !strings(section.paragraphs) || !section.paragraphs.length || (section.bullets !== undefined && !strings(section.bullets))) fail(`invalid case section in ${p.id}`)
    }
  }
  for (const c of categories) if (c.featuredProjectId !== null && !projects.some(p => p.id === c.featuredProjectId && p.status === 'published' && p.categoryId === c.id)) fail(`featured project must be published in its own category: ${c.id}`)
  return { categories, projects: projects.filter(p => p.status === 'published') }
}
export function loadCatalogue(root) {
  const read = path => JSON.parse(readFileSync(resolve(root, path), 'utf8').replace(/^\uFEFF/, ''))
  const categories = read('content/categories.json')
  const projects = readdirSync(resolve(root, 'content/projects')).filter(name => name.endsWith('.json')).sort().map(name => {
    const project = read(`content/projects/${name}`)
    if (name !== `${project.id}.json`) fail(`filename must match project id: ${name}`)
    return project
  })
  const publicRoot = realpathSync(resolve(root, 'public'))
  return validateCatalogue(categories, projects, path => {
    let file = resolve(publicRoot, '.' + path)
    if (path.endsWith('/')) file = resolve(file, 'index.html')
    return file.startsWith(publicRoot + sep) && existsSync(file) && realpathSync(file).startsWith(publicRoot + sep)
  })
}
const escape = value => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
const marker = '<!-- Generated by scripts/prepare-content.mjs. Edit content/projects instead. -->'
export function prepareCatalogue(root) {
  const catalogue = loadCatalogue(root)
  // Read every destination before writing, so an unowned page is never overwritten.
  const pages = catalogue.projects.map(p => {
    const path = resolve(root, 'projects', p.id, 'index.html')
    if (existsSync(path) && !readFileSync(path, 'utf8').includes(marker)) fail(`refusing to overwrite an unowned page: ${path}`)
    const html = `${marker}\n<!doctype html>\n<html lang="en-AU"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(p.title)} | Leon Li</title><meta name="description" content="${escape(p.summary)}"><link rel="icon" href="/favicon.svg" type="image/svg+xml"></head><body><div id="app" data-page="${p.renderer}" data-project="${p.id}"></div><noscript><h1>${escape(p.title)}</h1><p>${escape(p.summary)}</p><a href="/projects/">All projects</a>${p.links.map(link => ` · <a href="${escape(link.href)}">${escape(link.label)}</a>`).join('')}</noscript><script type="module" src="/src/main.ts"></script></body></html>\n`
    return { path, html, id: p.id }
  })
  const projectsRoot = resolve(root, 'projects')
  if (existsSync(projectsRoot)) for (const entry of readdirSync(projectsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory() || !slug.test(entry.name) || catalogue.projects.some(p => p.id === entry.name)) continue
    const stale = resolve(projectsRoot, entry.name, 'index.html')
    // Only delete an owned HTML entry inside the resolved projects directory.
    if (existsSync(stale) && realpathSync(stale).startsWith(realpathSync(projectsRoot) + sep) && readFileSync(stale, 'utf8').includes(marker)) unlinkSync(stale)
  }
  for (const { path, html } of pages) { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, html) }
  mkdirSync(resolve(root, 'src/data'), { recursive: true })
  writeFileSync(resolve(root, 'src/data/catalogue.json'), JSON.stringify(catalogue, null, 2) + '\n')
  return { home: resolve(root, 'index.html'), projects: resolve(root, 'projects/index.html'), ...Object.fromEntries(pages.map(p => [`project-${p.id}`, p.path])) }
}
