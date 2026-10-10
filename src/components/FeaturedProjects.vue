<script setup lang="ts">
import { catalogue } from '../catalogue'
import { selectFeatured } from '../lib/catalogue'
import ProjectCard from './ProjectCard.vue'
const featured = selectFeatured(catalogue.categories, catalogue.projects)
</script>
<template>
  <section id="projects" class="projects wrap section featured-section">
    <div class="catalogue-section-heading"><div><p class="eyebrow">SELECTED WORK</p><h2>Different skills.<br>Evidence in every project.</h2></div><div><p>One representative project from each area of my work. Explore the full collection by category.</p><a class="text-link" href="/projects/">Browse all projects <span aria-hidden="true">→</span></a></div></div>
    <div v-if="featured.length" class="project-grid featured-grid"><ProjectCard v-for="item in featured" :key="item.category.id" :project="item.project" :category="item.category" /></div>
    <p v-else class="catalogue-empty">The collection is being prepared. Check back for projects with documented evidence.</p>
    <a class="future-link" href="/projects/#future-directions">See the areas I plan to explore next <span aria-hidden="true">→</span></a>
  </section>
</template>
