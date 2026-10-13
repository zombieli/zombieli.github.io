import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import './catalogue.css'
import './cases.css'

const entry = document.getElementById('app')
createApp(App, { page: entry?.dataset.page || 'home', projectId: entry?.dataset.project }).mount('#app')
