<script setup lang="ts">
import { computed } from 'vue'
import { sourceFragments } from '../lib/manual-journey'
const props = defineProps<{ text: string; terms: string[] }>()
const fragments = computed(() => sourceFragments(props.text, props.terms))
</script>
<template><span class="manual-source-text"><template v-for="(fragment, index) in fragments" :key="index"><mark v-if="fragment.matched">{{ fragment.text }}</mark><template v-else>{{ fragment.text }}</template></template></span></template>
