import { existsSync, readFileSync } from 'node:fs'
import {createHash} from 'node:crypto'
import { loadCatalogue } from './catalogue.mjs'
const catalogue = loadCatalogue(process.cwd())
const packageInfo = JSON.parse(readFileSync('package.json', 'utf8'))
const versionInfo = JSON.parse(readFileSync('public/version.json', 'utf8'))
if (versionInfo.version !== packageInfo.version || versionInfo.release !== `v${packageInfo.version}`) throw new Error('Public release version and package version differ')
if (JSON.stringify(catalogue) !== JSON.stringify(JSON.parse(readFileSync('src/data/catalogue.json', 'utf8')))) throw new Error('Generated catalogue is stale; run npm run prepare:content')
const required = ['index.html', 'projects/index.html', ...catalogue.projects.map(p => `projects/${p.id}/index.html`), 'public/404.html', 'public/favicon.svg', 'public/evidence/normal-report.json', 'public/evidence/normal-cases.csv', 'public/evidence/failure-report.json', 'public/resume/leon-li-resume.pdf']
for (const path of required) if (!existsSync(path)) throw new Error(`Missing public content: ${path}`)
const app = readFileSync('src/App.vue', 'utf8')
if (app.includes('href="#"')) throw new Error('Empty link found')
for (const text of ['leon-li-a52208375', 'Student visa subclass 500', 'subject to visa conditions']) if (!app.includes(text)) throw new Error(`Missing confirmed profile: ${text}`)
const normal = JSON.parse(readFileSync('public/evidence/normal-report.json', 'utf8'))
const failure = JSON.parse(readFileSync('public/evidence/failure-report.json', 'utf8'))
if (normal.summary.pass !== 11 || normal.summary.fail !== 0 || failure.summary.fail !== 1) throw new Error('Evidence does not match case-study claims')
console.log('Content and recorded evidence checks passed')
for(const path of ['public/field-service-workflow/index.html','public/media/workflow-desktop.png','public/media/waiting-time-comparison.png','public/media/device-evidence-walkthrough.webm','public/media/device-evidence.vtt']) if(!existsSync(path))throw new Error(`Missing verified project asset: ${path}`)
const manifest=JSON.parse(readFileSync('public/evidence/release-manifest.json','utf8'))
if(!Array.isArray(manifest.bundles)||manifest.bundles.length<3)throw new Error('The three original source bundles must remain available')
for(const bundle of manifest.bundles){
  const bytes=readFileSync('public'+bundle.file)
  if(createHash('sha256').update(bytes).digest('hex')!==bundle.sha256)throw new Error(`Stale source bundle: ${bundle.project}`)
}
const scheduling=JSON.parse(readFileSync('public/evidence/scheduling-results.json','utf8'))
if(scheduling.scenario_count!==22||scheduling.rows.length!==44||scheduling.rows.some(row=>row.constraint_violations!==0))throw new Error('Scheduling claims do not match evidence')
if(readFileSync('src/data/scheduling-results.json','utf8')!==readFileSync('public/evidence/scheduling-results.json','utf8'))throw new Error('Scheduling page and download are out of sync')
console.log(`${manifest.bundles.length} project bundles, media and experiment evidence checks passed`)
