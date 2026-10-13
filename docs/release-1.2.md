# Portfolio 1.2 development and verification log

Date: 13 October 2026

## Scope

Refine the existing visual identity and improve ownership of case behaviour. Keep the blue-and-white palette, homepage introduction and study sidebar, rounded project cards, six categories and permanent URLs. Every populated category still contributes exactly one homepage project. The release also updates the website's downloadable resume to the verified current English version.

The release does not add new portfolio projects or change the bundled demos and their evidence claims.

## Development record

| Stage | Work completed | Reason and evidence |
| --- | --- | --- |
| Baseline | Built 1.1 before editing; 19 catalogue/generation tests passed | Established the existing authoring and selection behaviour |
| Architecture review | Inspected both release commits, catalogue generation, App, cases and tests | Diagnostics state and report parsing were coupled to the shared frame; profile checks depended on literal source placement |
| Design | Retained the original colour, typography, hero/sidebar and card structure | The selected direction was visual refinement, not a new identity |
| Report contract | Added response validation at the evidence adapter | Invalid HTTP/JSON, incomplete metadata, duplicate identities, invalid outcomes and malformed attempts fail before display |
| Case ownership | Moved the complete diagnostics interaction into its own module | Loading, cancellation, a 12-second deadline, retry, scenario selection and rendering remain together |
| Page loading | Load specialised and standard cases on demand | Homepage and collection do not load the diagnostics report or case implementation |
| Profile | Added one presentation record with independent validation | Contact, education, availability and visa details no longer depend on their location in Vue source |
| Visual refinement | Increased supporting text sizes, removed arbitrary labels, simplified project headings and regularised case spacing | Existing screenshots, category identities and evidence remain central |
| Navigation | Added Escape/focus restoration and desktop-resize closing to the mobile menu | Keyboard users can dismiss navigation and continue from the trigger |
| Resume | Replaced the public PDF with the current one-page English resume | Includes Field Service Workflow, Device Diagnostics Lab, Offline Inspection Notebook, GitHub and portfolio links |
| Regression review | Added delayed case-chunk and fragment-navigation checks; restore the initial destination when the diagnostics case mounts | A cold `#demo` navigation exposed a scroll restoration issue. The fix preserves visitor input and changed destinations, and the regression is retained in acceptance coverage |

Implementation decisions: [design and implementation plan](design-1.2.md), [case ownership decision](adr/0001-case-presentation.md), [domain glossary](../GLOSSARY.md).

## Verification approach

Contract tests were written before implementation: the initial validation stubs produced 26 expected failures, and the additional non-text outcome case reproduced a coercion issue before its fix. The final suite includes the original 19 catalogue/generation tests and new evidence/profile checks.

Browser acceptance uses the production build, all eight portfolio pages, four original viewport widths and additional 320 CSS-pixel reflow checks. It covers filters, sorting, browser history, future-category content, keyboard selection, menu focus, reduced motion, failure/retry, cold fragment links and case-chunk recovery. Actual request tracking checks that non-diagnostics pages do not request diagnostic evidence.

The authoring test publishes the first project in an isolated new category, opens its generated case, checks filtering, archives it and removes the fixture. The real catalogue is unchanged.

## Verification results

| Check | Result |
| --- | --- |
| Production build and TypeScript checks | Passed |
| Catalogue, evidence and profile rules | 49 passed |
| Authoring lifecycle | 5 passed |
| Archive validation | 8 passed |
| Production browser acceptance | 82 passed across eight pages and five viewport widths |
| Additional fragment guards | Encoded, malformed and unknown destinations, keyboard/wheel cancellation and changed fragments passed |
| Independent implementation review | No actionable findings after the final fragment fix |

Detailed acceptance records are in `qa/results.json` and `qa/authoring-results.json`. The delayed `#demo` regression now places the destination approximately 25 CSS pixels below the viewport top. Browser acceptance also verifies case-chunk failure recovery and report failure/retry without losing the case content.

Publication requires the GitHub checks and Pages deployment to succeed, followed by comparison of the deployed files with the accepted local build and a browser run against the public URL. Those deployment results belong to the versioned GitHub release, so this source record does not claim a deployment before it happens.

## Maintenance

- Content and category changes continue through `content/projects/*.json` and `content/categories.json`.
- Confirmed profile edits use `src/data/profile.json` and the factual assertions in `validateProfile`.
- The frame is `src/App.vue`; homepage presentation is `src/pages/HomePage.vue`.
- Diagnostics presentation is `src/cases/DiagnosticsCase.vue`; its response interface is `readDiagnosticsReport` in `src/lib/diagnostics-report.ts`.
- `src/style.css`, `src/catalogue.css` and `src/cases.css` own the frame/home, catalogue and case styles respectively.

## Limits

Browser checks use desktop Chromium at responsive viewport sizes; they are not physical-phone tests, a formal accessibility audit or a Lighthouse score. Project data remains fictional or simulated. The report viewer displays saved evidence and does not connect to physical hardware. Resume availability remains subject to visa conditions.
