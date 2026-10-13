<script setup lang="ts">
import { computed, defineAsyncComponent, h, onMounted, onUnmounted, ref } from 'vue'
import HomePage from './pages/HomePage.vue'
import ProjectLibrary from './components/ProjectLibrary.vue'
import { catalogue } from './catalogue'
import profile from './data/profile.json'

const props = defineProps<{ page: string; projectId?: string }>()
const project = computed(() => catalogue.projects.find(item => item.id === props.projectId))
const category = computed(() => catalogue.categories.find(item => item.id === project.value?.categoryId))
const inProjects = computed(() => ['projects', 'standard', 'diagnostics', 'workflow', 'scheduling'].includes(props.page))

const caseLoading = {
  loadingComponent: () => h('section', { class: 'wrap section page-status', role: 'status' }, 'Loading project…'),
  errorComponent: () => h('section', { class: 'wrap section page-status', role: 'alert' }, [
    h('h1', 'This project could not be loaded.'),
    h('p', 'Reload this page to try again, or return to the project collection.'),
    h('div', { class: 'actions' }, [
      h('button', { class: 'button primary', type: 'button', onClick: () => window.location.reload() }, 'Reload page'),
      h('a', { class: 'button secondary', href: '/projects/' }, 'All projects'),
    ]),
  ]),
  delay: 150,
  timeout: 15000,
}
const DiagnosticsCase = defineAsyncComponent({ ...caseLoading, loader: () => import('./cases/DiagnosticsCase.vue') })
const WorkflowCase = defineAsyncComponent({ ...caseLoading, loader: () => import('./WorkflowCase.vue') })
const SchedulingCase = defineAsyncComponent({ ...caseLoading, loader: () => import('./SchedulingCase.vue') })
const StandardCase = defineAsyncComponent({ ...caseLoading, loader: () => import('./components/StandardCase.vue') })

const menuOpen = ref(false)
const menuButton = ref<HTMLButtonElement | null>(null)
let desktop: MediaQueryList | undefined
let initialFragment = props.page === 'diagnostics' ? window.location.hash : ''
const initialScrollY = window.scrollY
let fragmentFrame: number | undefined
const fragmentInterruptions = ['pointerdown', 'wheel', 'touchstart', 'keydown', 'hashchange'] as const

function cancelFragmentRestore() {
  initialFragment = ''
  if (fragmentFrame !== undefined) window.cancelAnimationFrame(fragmentFrame)
  for (const event of fragmentInterruptions) window.removeEventListener(event, cancelFragmentRestore)
}

function restoreInitialFragment() {
  if (!initialFragment) return
  // Native fragment navigation may finish before an asynchronous case exists.
  // Restore that initial intent once, unless the visitor has already moved on.
  fragmentFrame = window.requestAnimationFrame(() => {
    let target: HTMLElement | null = null
    if (window.location.hash === initialFragment && window.scrollY === initialScrollY) {
      try {
        target = document.getElementById(decodeURIComponent(initialFragment.slice(1)))
      } catch {
        // Invalid percent encoding is not a usable element identity.
      }
    }
    cancelFragmentRestore()
    target?.scrollIntoView({ behavior: 'instant', block: 'start' })
  })
}

function closeMenu() {
  menuOpen.value = false
}
function escapeMenu(event: KeyboardEvent) {
  if (event.key !== 'Escape' || !menuOpen.value) return
  event.preventDefault()
  closeMenu()
  menuButton.value?.focus()
}
function resizeMenu() {
  if (desktop?.matches) closeMenu()
}
onMounted(() => {
  desktop = window.matchMedia('(min-width: 761px)')
  desktop.addEventListener('change', resizeMenu)
  window.addEventListener('keydown', escapeMenu)
  if (initialFragment) for (const event of fragmentInterruptions) window.addEventListener(event, cancelFragmentRestore, { passive: true })
})
onUnmounted(() => {
  desktop?.removeEventListener('change', resizeMenu)
  window.removeEventListener('keydown', escapeMenu)
  cancelFragmentRestore()
})
</script>

<template>
  <a class="skip" href="#main">Skip to content</a>
  <header class="site-header wrap">
    <a class="brand" href="/" :aria-label="`${profile.name} home`"><span class="monogram" aria-hidden="true">L</span> {{ profile.name }}</a>
    <button ref="menuButton" class="menu-button" type="button" :aria-expanded="menuOpen" aria-controls="navigation" @click="menuOpen = !menuOpen">Menu</button>
    <nav id="navigation" :class="{ open: menuOpen }" aria-label="Main navigation" @click="closeMenu">
      <a href="/projects/" :aria-current="page === 'projects' ? 'page' : inProjects ? 'location' : undefined">Projects</a>
      <a href="/#about">About</a>
      <a :href="profile.resume">Resume</a>
      <a :href="`mailto:${profile.email}`">Contact</a>
    </nav>
  </header>

  <main id="main" tabindex="-1">
    <HomePage v-if="page === 'home'" />
    <ProjectLibrary v-else-if="page === 'projects'" />
    <StandardCase v-else-if="page === 'standard' && project && category" :project="project" :category="category" />
    <DiagnosticsCase v-else-if="page === 'diagnostics'" @ready="restoreInitialFragment" />
    <WorkflowCase v-else-if="page === 'workflow'" />
    <SchedulingCase v-else-if="page === 'scheduling'" />
    <section v-else class="wrap section page-status">
      <h1>Project unavailable.</h1>
      <p>This project is not part of the published collection.</p>
      <a class="button secondary" href="/projects/">All projects</a>
    </section>
  </main>
  <footer class="wrap site-footer">
    <span>{{ profile.name }} · {{ profile.location }}</span>
    <a :href="profile.github">GitHub</a>
    <a :href="profile.linkedin">LinkedIn</a>
    <span>© 2026</span>
  </footer>
</template>
