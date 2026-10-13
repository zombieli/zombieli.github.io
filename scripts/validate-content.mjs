import { existsSync, readFileSync } from 'node:fs'
import {createHash} from 'node:crypto'
import { pathToFileURL } from 'node:url'
import { loadCatalogue } from './catalogue.mjs'

export function validateProfile(profile) {
  const fields = ['name', 'email', 'location', 'degree', 'specialisation', 'university', 'graduation', 'internshipStart', 'availability', 'workRights', 'github', 'linkedin', 'resume']
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) throw new Error('Profile must be a record')
  for (const field of fields) {
    if (typeof profile[field] !== 'string' || !profile[field].trim()) throw new Error(`Profile requires ${field}`)
  }
  // These factual checks change only when the confirmed personal details change.
  const confirmed = {
    email: 'ziangli092@gmail.com',
    specialisation: 'Software Engineering',
    graduation: 'Expected June 2027',
    internshipStart: 'January 2027 preferred; available from November 2026',
    availability: 'Full-time during university holidays, subject to visa conditions',
    workRights: 'Student visa subclass 500',
    github: 'https://github.com/zombieli',
    linkedin: 'https://www.linkedin.com/in/leon-li-a52208375/',
    resume: '/resume/leon-li-resume.pdf',
  }
  for (const [field, value] of Object.entries(confirmed)) {
    if (profile[field] !== value) throw new Error(`Profile ${field} differs from the confirmed details`)
  }
  return profile
}

function validateContent() {
  const catalogue = loadCatalogue(process.cwd())
  const packageInfo = JSON.parse(readFileSync('package.json', 'utf8'))
  const versionInfo = JSON.parse(readFileSync('public/version.json', 'utf8'))
  if (versionInfo.version !== packageInfo.version || versionInfo.release !== `v${packageInfo.version}`) throw new Error('Public release version and package version differ')
  if (JSON.stringify(catalogue) !== JSON.stringify(JSON.parse(readFileSync('src/data/catalogue.json', 'utf8')))) throw new Error('Generated catalogue is stale; run npm run prepare:content')
  const required = ['index.html', 'projects/index.html', ...catalogue.projects.map(p => `projects/${p.id}/index.html`), 'public/404.html', 'public/favicon.svg', 'public/evidence/normal-report.json', 'public/evidence/normal-cases.csv', 'public/evidence/failure-report.json', 'public/resume/leon-li-resume.pdf']
  for (const path of required) if (!existsSync(path)) throw new Error(`Missing public content: ${path}`)
  validateProfile(JSON.parse(readFileSync('src/data/profile.json', 'utf8')))
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
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) validateContent()
