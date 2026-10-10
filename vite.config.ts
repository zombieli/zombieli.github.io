import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { prepareCatalogue } from './scripts/catalogue.mjs'

// Generate only published routes; a new project never needs a Vite edit.
const input = prepareCatalogue(import.meta.dirname)

export default defineConfig({
  plugins: [vue()],
  base: '/',
  build: {
    rolldownOptions: {
      input,
    },
  },
})
