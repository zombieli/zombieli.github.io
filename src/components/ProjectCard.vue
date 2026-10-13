<script setup lang="ts">
import type { Category, Project } from '../lib/catalogue'
import { categoryHref, projectHref } from '../lib/catalogue'
defineProps<{ project: Project; category: Category }>()
</script>
<template>
  <article class="catalogue-card" :data-project="project.id" :data-category="category.id">
    <img class="catalogue-cover" :class="`fit-${project.cover.fit}`" :src="project.cover.src" :alt="project.cover.alt" width="900" height="540" loading="lazy">
    <div class="catalogue-card-body">
      <a class="category-label" :href="categoryHref(category)">{{ category.label }}</a>
      <h3><a :href="projectHref(project)">{{ project.title }}</a></h3>
      <p class="card-summary">{{ project.summary }}</p>
      <ul class="technology-list" aria-label="Technologies"><li v-for="technology in project.technologies" :key="technology">{{ technology }}</li></ul>
      <p class="card-proof">{{ project.proof }}</p>
      <div class="card-footer"><a class="text-link" :href="projectHref(project)" :aria-label="`View case study: ${project.title}`">View case study</a><time :datetime="project.updatedAt">Updated {{ project.updatedAt }}</time></div>
    </div>
  </article>
</template>
