<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { catalogue } from '../catalogue'
import { categoryCount, filterProjects, filterQuery, readFilters } from '../lib/catalogue'
import type { Filters } from '../lib/catalogue'
import ProjectCard from './ProjectCard.vue'
const { categories, projects } = catalogue
const initial = readFilters(window.location.search, categories)
const filters = ref<Filters>(initial.filters)
const unknownCategory = ref(initial.unknownCategory)
const results = computed(() => filterProjects(projects, categories, filters.value))
const selectedCategory = computed(() => categories.find(c => c.id === filters.value.category))
const futureCategories = categories.filter(c => categoryCount(projects, c.id) === 0)
const categoryById = Object.fromEntries(categories.map(c => [c.id, c]))
function changeFilters(patch: Partial<Filters>, replace = false) {
  filters.value = { ...filters.value, ...patch }
  unknownCategory.value = false
  const href = '/projects/' + filterQuery(filters.value)
  if (href !== window.location.pathname + window.location.search + window.location.hash) {
    if (replace) window.history.replaceState(null, '', href)
    else window.history.pushState(null, '', href)
  }
}
function search(event: Event) { changeFilters({ q: (event.target as HTMLInputElement).value }, true) }
function sort(event: Event) { changeFilters({ sort: (event.target as HTMLSelectElement).value as Filters['sort'] }) }
function restoreFilters() {
  const parsed = readFilters(window.location.search, categories)
  filters.value = parsed.filters
  unknownCategory.value = parsed.unknownCategory
}
onMounted(() => window.addEventListener('popstate', restoreFilters))
onUnmounted(() => window.removeEventListener('popstate', restoreFilters))
</script>
<template>
  <section class="library-heading wrap">
    <p class="eyebrow">PROJECT COLLECTION</p><h1>Explore the work.</h1>
    <p class="hero-description">Browse by the kind of problem you’re interested in. Every published project includes its decisions, evidence and limitations.</p>
    <p class="collection-meta">{{ projects.length }} published projects <span aria-hidden="true">/</span> {{ categories.length - futureCategories.length }} areas with work <span aria-hidden="true">/</span> <a href="#future-directions">Future directions</a></p>
  </section>
  <section class="library-layout wrap" aria-label="Browse projects">
    <aside class="category-sidebar"><h2 id="category-heading">Browse by category</h2>
      <div class="category-filters" role="group" aria-labelledby="category-heading">
        <button :aria-pressed="filters.category === 'all'" @click="changeFilters({ category: 'all' })"><span>All projects</span><span class="category-count">{{ projects.length }}</span></button>
        <button v-for="category in categories" :key="category.id" :aria-pressed="filters.category === category.id" @click="changeFilters({ category: category.id })"><span>{{ category.label }}<small v-if="!categoryCount(projects, category.id)">Future direction</small></span><span class="category-count">{{ categoryCount(projects, category.id) }}</span></button>
      </div>
      <p class="sidebar-note">Counts include published work only. Each project has one primary category.</p>
    </aside>
    <div class="library-results">
      <div class="library-toolbar"><div class="search-field"><label for="project-search">Search projects</label><input id="project-search" type="search" :value="filters.q" placeholder="Project, technology or topic" @input="search"></div><div class="sort-field"><label for="project-sort">Sort by</label><select id="project-sort" :value="filters.sort" @change="sort"><option value="updated">Recently updated</option><option value="title">Title A–Z</option></select></div></div>
      <p v-if="unknownCategory" class="filter-notice" role="status">This category is unavailable. Showing all categories instead.</p>
      <div class="results-heading"><div><h2>{{ selectedCategory?.label || 'All projects' }}</h2><p v-if="selectedCategory">{{ selectedCategory.description }}</p></div><p class="result-count" role="status" aria-live="polite" aria-atomic="true">{{ results.length }} {{ results.length === 1 ? 'project' : 'projects' }}</p></div>
      <div v-if="results.length" class="project-grid library-grid"><ProjectCard v-for="project in results" :key="project.id" :project="project" :category="categoryById[project.categoryId]!" /></div>
      <div v-else class="catalogue-empty">
        <template v-if="selectedCategory && !categoryCount(projects, selectedCategory.id)"><p class="eyebrow">FUTURE DIRECTION</p><h3>No published projects here yet.</h3><p>This is an area I plan to explore. These ideas are not completed projects:</p><ul><li v-for="idea in selectedCategory.ideas" :key="idea">{{ idea }}</li></ul></template>
        <template v-else><h3>No projects match these filters.</h3><p>Try a different technology or a broader search.</p></template>
        <button class="button secondary" @click="changeFilters({ category: 'all', q: '' })">Show all projects</button>
      </div>
      <button v-if="results.length && (filters.q || filters.category !== 'all')" class="reset-filters" @click="changeFilters({ category: 'all', q: '' })">Clear search and category</button>
    </div>
  </section>
  <section id="future-directions" class="wrap section future-section"><div class="catalogue-section-heading"><div><p class="eyebrow">LOOKING AHEAD</p><h2>Future directions.</h2></div><p>Ideas for the next additions to this collection. They represent planned areas of exploration, with no completed work claimed.</p></div>
    <div v-if="futureCategories.length" class="future-grid"><article v-for="category in futureCategories" :key="category.id"><span class="planned-label">PLANNED AREA</span><h3>{{ category.label }}</h3><p>{{ category.description }}</p><ul><li v-for="idea in category.ideas" :key="idea">{{ idea }}</li></ul></article></div>
    <p v-else>There is published work in every category. Future additions will deepen the existing collection.</p>
  </section>
</template>
