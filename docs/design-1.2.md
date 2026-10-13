# Portfolio 1.2 design and implementation plan

## Purpose

Help a software internship recruiter in Western Australia understand Leon's work, inspect relevant evidence and find his resume. Preserve English content, honest project limitations, stable URLs and a maintainable collection. Every populated category must continue to contribute exactly one homepage project.

## Visual direction

Preserve the current visual identity, as requested: blue and white, the existing two-part homepage introduction, rounded project cards and the familiar page order. Refine spacing, text size, focus visibility and sentence-case labels. Keep the existing project images. Remove arbitrary numbering and decorative labels without replacing the site's identity.

Palette: canvas `#F8FAFC`, surface `#FFFFFF`, text `#172033`, secondary text `#536078`, border `#D6DFEB`, action `#1D4ED8`. Keep the site's Inter/Arial/sans-serif stack; no remote font dependency. Body text starts at 17px; supporting text stays at least 13px. Paragraphs stay within 75 characters where practical.

Left-align text. Keep the introduction and study sidebar on desktop; stack them on mobile. Show six category representatives in the existing three-column card layout, followed by study, practical experience and internship details. The collection keeps a category rail on desktop and wrapping category controls on mobile. Case studies retain evidence and limitations with readable actions near the title.

```text
Name                                      Projects  About  Resume  Contact
Introduction + availability                Current focus and study
Explore projects / resume                 Graduation

Projects by category                      Browse all projects
Project card                 Project card                 Project card
Project card                 Project card                 Project card

About and study                           Internship details and contact
```

Critique: the user chose continuity over a new visual direction. Keep the original blue headline line and card treatment deliberately; improve their readability instead of applying a new workbench or editorial theme. Actual project captures, stable category names and plain English carry the subject matter. No automatic animation is needed.

## Architecture decisions

Keep Vue, Vite and the existing multi-page static build. Do not add a router, content server or speculative plugin registry.

- Deepen the diagnostics case module: it owns report loading, validation, selected scenario, retry state and presentation. Its interface exposes a rendered case; the report adapter rejects data the viewer cannot safely consume. This improves locality and makes malformed evidence part of the test surface.
- App owns the shared frame and page selection. Homepage content moves to a cohesive home module. Case modules load only where used.
- Store confirmed personal facts and links in one profile record consumed by presentation and content verification. Build checks must not depend on which Vue file contains literal profile text.
- Keep the catalogue generation module and existing filtering interface. Their current depth and lifecycle coverage already support adding projects. No new history adapter is justified by a second consumer.
- Divide styles into base/frame/home, catalogue and case presentation so unused legacy homepage rules can be removed.

## Implementation steps

- [x] Preserve baseline build results and create the 1.2 development branch.
- [x] Add diagnostics response contract tests, then move the viewer and implement unavailable/retry states. Verify original scenarios and malformed responses.
- [x] Add the shared profile record and update source-placement-dependent verification.
- [x] Implement homepage, project presentation, sentence-case content and responsive style system. Preserve category selection and shareable URLs.
- [x] Improve mobile menu Escape/focus behaviour; preserve keyboard and reduced-motion support.
- [x] Replace the public resume with the verified current English PDF.
- [x] Run build, rule tests, authoring lifecycle tests, source-bundle checks and browser acceptance. Inspect desktop/mobile captures of home, collection and cases.
- [x] Perform an independent review, resolve findings and record actual results.
- [x] Update versions, changelog and development records for 1.2.0.

Release procedure: publish main, wait for checks and Pages, compare public downloads with the accepted build, run public browser acceptance, and publish the v1.2.0 tag and release. Record deployment evidence in the GitHub release.

## Review focus

1. Valid HTTP with malformed report content must show recovery actions without losing the case study.
2. All category/search/sort combinations must survive reload and history navigation.
3. Mobile navigation must close on Escape and return focus to its trigger without trapping it.
4. New or archived project records must update routes and homepage representatives without source edits.
5. CSS changes must not clip case code, tables, long metadata, filters or future-category content at 320 CSS pixels and larger widths.

## Release constraints

Existing project URLs, evidence files and source bundles remain valid. Demo behaviour and recorded test claims do not change. Future ideas remain labelled as unimplemented. The website's resume is updated, but the release does not submit applications or send messages. Check the deployed version and release tag before reporting publication complete.
