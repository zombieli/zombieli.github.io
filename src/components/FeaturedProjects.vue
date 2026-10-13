<script setup lang="ts">
import { catalogue } from '../catalogue'
import { selectFeatured } from '../lib/catalogue'
import ProjectCard from './ProjectCard.vue'
const featured = selectFeatured(catalogue.categories, catalogue.projects)
</script>
<template>
  <section id="projects" class="projects wrap section featured-section">
    <div class="catalogue-section-heading"><div><h2>Projects by category</h2><p>One project from each area. Open a case study to see the implementation, tests and limitations.</p></div><a class="button secondary" href="/projects/">Browse all projects</a></div>
    <div v-if="featured.length" class="project-grid featured-grid"><ProjectCard v-for="item in featured" :key="item.category.id" :project="item.project" :category="item.category" /></div>
    <p v-else class="catalogue-empty">The collection is being prepared. Check back for projects with documented evidence.</p>
    <a class="future-link" href="/projects/#future-directions">See future project ideas</a>
  </section>
</template>
