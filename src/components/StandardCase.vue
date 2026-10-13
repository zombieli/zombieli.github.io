<script setup lang="ts">
import type { Category, Project } from '../lib/catalogue'
import { categoryHref } from '../lib/catalogue'
defineProps<{ project: Project; category: Category }>()
</script>
<template>
  <section class="case-heading wrap"><a class="back" :href="categoryHref(category)">All {{ category.label.toLowerCase() }} projects</a><p class="eyebrow">{{ category.label }}</p><h1>{{ project.title }}</h1><p class="hero-description">{{ project.summary }}</p><div class="case-facts"><div><span>MY CONTRIBUTION</span><strong>{{ project.caseStudy?.role }}</strong></div><div><span>UPDATED</span><strong>{{ project.updatedAt }}</strong></div><div><span>EVIDENCE</span><strong>{{ project.proof }}</strong></div></div></section>
  <div class="wrap actions"><a v-for="link in project.links" :key="link.href" class="button secondary" :href="link.href">{{ link.label }}</a></div>
  <article v-if="project.caseStudy" class="wrap section standalone-case standard-case">
    <figure><img :src="project.cover.src" :alt="project.cover.alt"><figcaption>{{ project.cover.alt }}</figcaption></figure>
    <h2>Context</h2><p>{{ project.caseStudy.context }}</p>
    <ul class="technology-list" aria-label="Technologies"><li v-for="technology in project.technologies" :key="technology">{{ technology }}</li></ul>
    <section v-for="(section, index) in project.caseStudy.sections" :key="index"><h2>{{ section.heading }}</h2><p v-for="(paragraph, i) in section.paragraphs" :key="i">{{ paragraph }}</p><ul v-if="section.bullets?.length"><li v-for="(bullet, i) in section.bullets" :key="i">{{ bullet }}</li></ul></section>
    <h2>Limitations</h2><ul><li v-for="(limitation, i) in project.caseStudy.limitations" :key="i">{{ limitation }}</li></ul>
    <h2>Explore and reproduce</h2><div class="actions"><a v-for="link in project.links" :key="link.href" class="button secondary" :href="link.href">{{ link.label }}</a></div>
  </article>
</template>
