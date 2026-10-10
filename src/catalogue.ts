import data from './data/catalogue.json'
import type { Catalogue } from './lib/catalogue'
// Only validated, published records are written to this generated file.
export const catalogue = data as Catalogue
