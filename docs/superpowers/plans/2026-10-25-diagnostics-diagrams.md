# Clickable diagnostics diagrams

The user requested animated, clickable diagrams alongside the existing six-stage story. This extends the already approved local implementation; keep the current Vue stack, English copy and blue/white identity.

## Design

- A six-node build map near the top: distinct small drawings for scope, protocol, modules, recovery, verification and evidence. Selecting a node illuminates its incoming connector, reveals the stage's deliverable and offers a native link to that chapter. This is a development map, not a live device simulation.
- Replace the architecture disclosure list with a connected diagram of the runner, TCP adapter, simulator, validation and reporting boundaries. Clicking a node highlights its path and displays its source responsibility.
- Add replayable, step-selectable diagrams to both recorded-evidence panels. Retry traces the actual attempts and policy; expectation traces the recorded observation, comparison and result. Playback is illustrative and never changes the reports.
- Reuse existing colours (#1d4ed8, #172033, #536078, #d6dfeb, #fff, #f8fafc), type and rounded controls. Use geometry and packet movement to convey relationships, with no continuous decorative motion.
- All diagrams reflow at 320px, use native buttons and respect reduced-motion. Playback can pause/replay; changing scenario cancels old playback.

## Work and verification

- [x] Add browser acceptance and observe RED against the existing site.
- [x] Build six-stage map and integrate it into the page.
- [x] Build architecture diagram and recorded flows in independent components.
- [x] Run build, diagram acceptance, existing journey and whole-site regression checks; inspect screenshots.
- [x] Independent review, resolve issues, refresh the same local preview.

Verified on 2026-10-25: production build, content validation, TypeScript and 49 tests pass. Browser suites pass 82 whole-site checks, 8 journey checks and 6 animated-diagram groups, including scenario-switch cancellation, pause/replay, manual stepping, live reduced-motion changes and 320/390/768/1440px layouts. Desktop and mobile screenshots inspected; independent code review found no actionable issues. `git diff --check` passes. Preview remains at http://127.0.0.1:4174/projects/device-diagnostics/#build-map.

## Boundaries

No dependencies, report alterations, new hardware claims, commits or public deployment. Preserve current working changes and existing routes, downloads, error handling and raw scenario viewer.
