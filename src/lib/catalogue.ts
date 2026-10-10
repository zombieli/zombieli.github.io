export type Category = {
  id: string; label: string; description: string; featuredProjectId: string | null; ideas: string[]
}
export type Project = {
  id: string; title: string; categoryId: string; status: 'draft' | 'published' | 'archived'
  publishedAt: string; updatedAt: string; summary: string; technologies: string[]; tags: string[]
  proof: string; cover: { src: string; alt: string; fit: 'cover' | 'contain' }
  renderer: 'diagnostics' | 'workflow' | 'scheduling' | 'standard'
  links: { label: string; href: string }[]
  caseStudy?: {
    role: string; context: string
    sections: { heading: string; paragraphs: string[]; bullets?: string[] }[]
    limitations: string[]
  }
}
export type Catalogue = { categories: Category[]; projects: Project[] }
export type Filters = { category: string; q: string; sort: 'updated' | 'title' }
const alphabetical = (a: string, b: string) => a.localeCompare(b, 'en')
export const publishedProjects = (projects: Project[]) => projects.filter(p => p.status === 'published')
export const projectHref = (project: Project) => `/projects/${project.id}/`
export const categoryHref = (category: Category) => `/projects/?category=${encodeURIComponent(category.id)}`
export const categoryCount = (projects: Project[], id: string) => publishedProjects(projects).filter(p => p.categoryId === id).length
export function selectFeatured(categories: Category[], projects: Project[]) {
  const published = publishedProjects(projects)
  return categories.flatMap(category => {
    const candidates = published.filter(p => p.categoryId === category.id)
    const project = candidates.find(p => p.id === category.featuredProjectId)
      ?? candidates.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || alphabetical(a.id, b.id))[0]
    return project ? [{ category, project }] : []
  })
}
const normalise = (value: string) => value.normalize('NFKC').toLocaleLowerCase('en').trim()
export function filterProjects(projects: Project[], categories: Category[], filters: Filters) {
  const tokens = normalise(filters.q).split(/\s+/).filter(Boolean)
  return publishedProjects(projects).filter(project => {
    if (filters.category !== 'all' && project.categoryId !== filters.category) return false
    const category = categories.find(c => c.id === project.categoryId)
    const haystack = normalise([project.title, project.summary, category?.label, ...project.technologies, ...project.tags].join(' '))
    return tokens.every(token => haystack.includes(token))
  }).sort((a, b) => filters.sort === 'title'
    ? alphabetical(a.title, b.title) || alphabetical(a.id, b.id)
    : b.updatedAt.localeCompare(a.updatedAt) || alphabetical(a.title, b.title) || alphabetical(a.id, b.id))
}
export function readFilters(search: string, categories: Category[]): { filters: Filters; unknownCategory: boolean } {
  const params = new URLSearchParams(search)
  const category = params.get('category') || 'all'
  const unknownCategory = category !== 'all' && !categories.some(c => c.id === category)
  return { filters: { category: unknownCategory ? 'all' : category, q: params.get('q') || '', sort: params.get('sort') === 'title' ? 'title' : 'updated' }, unknownCategory }
}
export function filterQuery(filters: Filters) {
  const params = new URLSearchParams()
  if (filters.category !== 'all') params.set('category', filters.category)
  if (filters.q) params.set('q', filters.q)
  if (filters.sort !== 'updated') params.set('sort', filters.sort)
  return params.size ? `?${params}` : ''
}
