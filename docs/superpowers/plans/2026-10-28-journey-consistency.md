# Six-project interaction review

Scope: preserve the six projects' source-backed explanations and existing blue/white visual style. Review shared behaviour, repair demonstrated issues, and preview the production build locally.

Baseline browser audit covered 1440, 390, 320 and 844 px widths. No document overflow, duplicate IDs or broken chapter fragments were found. Confirmed issues: disclosure targets below 44 px; small scheduling policy targets; mobile form text below 16 px; three maps replayed old feedback after a reduced-motion preference change; inspection import animated on initial load. Source review also found inconsistent replay intervals and scenario-triggered automatic playback.

Implementation:
1. Share explicit replay, pause, 1200 ms steps and 650 ms click feedback. Scenario selection resets without starting playback; selecting a step pauses. Reduced motion, backgrounding and unmount cancel pending timers, with no automatic resumption.
2. Keep all six maps' subject-specific symbols, reading order and native buttons. Clear temporary feedback after completion and preference changes.
3. Make form controls at least 16 px on touch/mobile layouts, disclosure and policy targets at least 44 px, and retain visible keyboard focus.
4. Verify all six at desktop/mobile/landscape widths, keyboard focus, replay and reduced motion, direct chapter anchors, then run existing project and whole-site regressions. Capture real viewport screenshots and open the homepage preview.

Historical project results remain separate from this portfolio UI review.

## Verification completed

- `npm run build`: content and six source bundles validated, 90 logic tests passed, TypeScript and production build passed.
- Existing browser suites: 82 whole-site checks; 8 diagnostics journey, 6 diagnostics motion, 9 workflow journey, 2 delayed fragment, 10 scheduling, 12 inspection, 11 delta and 11 manual checks passed. Diagnostics and workflow checks were rerun after their final adjustments.
- `node scripts/journey-audit.cjs`: 24 project/viewport combinations passed, all 36 stage buttons retained keyboard focus, all 11 replayable walkthroughs advanced and paused correctly, visibility and reduced-motion changes stopped playback without resuming it. Initial map fragments resolved after lazy loading. No page errors.
- Touch emulation at 390 × 844 with a 2× pixel ratio passed for all six. Twelve map/demo viewport screenshots plus homepage screenshots were visually reviewed. These are Chromium mobile emulation checks, not physical iOS device tests.
- Evidence: `qa/consistency/results.json`, `audit.json`, per-suite logs, and viewport PNGs. Generated QA artifacts are intentionally ignored by Git.
- At the end of this UI review, the result was available only in the local production preview at `http://127.0.0.1:4174/`. The later publication request is recorded in [release 1.3](../../release-1.3.md).
