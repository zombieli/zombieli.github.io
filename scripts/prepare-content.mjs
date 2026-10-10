import { resolve } from 'node:path'
import { prepareCatalogue } from './catalogue.mjs'
const entries = prepareCatalogue(resolve(import.meta.dirname, '..'))
console.log(`Catalogue prepared: ${Object.keys(entries).length - 2} published projects`)
