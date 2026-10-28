# Workshop Scheduling Study: interactive development journey

Continue the user's approved six-stage case-study form for the third featured project. Existing Vue/TypeScript, blue/white styling, English site copy and local preview remain. No dependency, source-project mutation, commit or publication.

## Design

Six stages: frame the question; define the single-bench model; implement ready-job dispatch; validate independently; compare controlled experiments; package reproducibility. This groups actual development work rather than historical commits.

The six-node illustrated overview selects a real decision/artifact and links to its chapter. Keep the established font variables, left-aligned reading column and palette (#1d4ed8, #172033, #536078, #d6dfeb, #ffffff, #f8fafc). Use the source chart's restrained orange only for the long-wait trade-off.

Main interactions:

- Recorded dispatch explorer: replay the saved FCFS/SPT timelines for steady, sparse and one mixed scenario. Click/select a job or dispatch to inspect release/start/end/wait, ready jobs and unreleased jobs. Two aligned Gantt lanes show the complete recorded schedules; the selected step/cursor and detail explain the decision. Native controls, no initial autoplay, pause/replay/manual steps and live reduced-motion handling. Timing is illustrative; no Python simulation is run in-browser.
- Independent validation gate: a small source-test example can be kept valid or deliberately corrupted. Click/replay coverage, release/time, duration and changeover checks. Invalid candidates stop before metrics and show their specific reason. Separate these illustrative cases from saved experiment evidence; implement a small checked presentation validator grounded in Python semantics.
- Results comparison: select any of the 22 recorded scenarios and switch average/longest waiting metric. Paired bars animate once on change; exact values and the full saved table stay readable. The steady-arrival trade-off and sparse equality are explicit; no optimality or operational savings claim.

This focuses animation on the scheduling decisions and evidence gates, rather than a generic system architecture. Preserve the original chart, table, downloads, provenance and scope. The historical 36 tests and 44 feasible runs stay dated 9 October 2026 (UTC+8); new presentation tests are recorded separately.

## Work

- [x] Verify source semantics and saved experiment evidence.
- [x] Prepare exact timeline evidence and a documented three-scenario playback subset.
- [x] Build recorded dispatch explorer and meaningful data/model checks.
- [x] Build independent validator explainer and corruption/gate tests.
- [x] Integrate six stages, map, recorded comparison and cold chapter navigation.
- [x] Build, check browser interactions and regression, inspect mobile/desktop screenshots, review and open preview.

## Verification

Use source-aligned checks for release-only selection, deterministic ties, no initial/trailing setup, sparse idle periods, final recorded metrics, validation rejection before metrics, timer cancellation, keyboard controls, reduced motion and 320/390/768/1440px reflow. Verify all downloaded evidence copies and preserve first/second-project checks. Source experiment outputs must not be overwritten or regenerated.

Verified 27 October 2026:

- Model tests first failed with missing modules; browser acceptance first failed because the prior page had no journey map.
- Final production build passes content/bundle validation, TypeScript and 65 tests, including 8 new scheduling presentation checks. The validator independently checks all 44 saved schedules and reproduces their waiting metrics. The playback subset matches saved inputs, slots, metrics and provenance for steady-short-arrivals, sparse-arrivals and mixed-00.
- All 10 new browser groups pass, including the long-job 0 versus 93-minute start, sparse idle periods, cancellation, validation rejection before metrics, 22-scenario comparison, reduced motion, keyboard controls, four viewport widths and delayed-loading fragment navigation.
- Whole-site regression passes 82 checks. First-project suites pass 8 journey and 6 animation groups; second-project suites pass 9 journey and 2 cold-fragment checks. Original Python experiments were not rerun or overwritten.
- Independent code review found no actionable issues. Desktop/mobile screenshots inspected; mobile legend items now wrap with their labels. Tall element screenshots can include the offscreen fixed skip link due to capture clipping; a fresh actual viewport confirmed it remains outside the screen (top -100px, bottom -47.95px, not focused).
- Three new public evidence copies match their originals by SHA-256. `git diff --check` passes.

Results and screenshots: ignored `qa/scheduling-journey/`; final build output: `qa/scheduling-build.log`. Local preview: http://127.0.0.1:4174/projects/scheduling/#scheduling-build-map. No commit, push or public deployment.
