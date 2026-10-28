# Development record

9 October 2026 (UTC+8). Designed a new workshop scheduling problem rather than restoring or renaming an earlier vessel scheduling project.

1. Defined a single non-preemptive bench, integer release times, known durations and two-minute changeover.
2. Implemented deterministic FCFS and SPT dispatch, with stable ID tie-breaking and no use of future arrival information.
3. Wrote an independent validator for coverage, release, duration, ordering and changeover constraints. Invalid schedules cannot enter the metrics pipeline.
4. Added corrupted-schedule and invalid-input tests, known-answer cases and repeatability/feasibility checks for every experimental input.
5. Executed `python -m pytest -q -p no:cacheprovider`: **36 passed in 0.06 seconds**.
6. Executed `python experiment.py`: **44 feasible policy runs across 22 scenarios**, with zero observed constraint violations.
7. Saved complete inputs, timelines, CSV/JSON results, environment versions, source hash and Matplotlib PNG/SVG charts. Inspected the chart visually for labels, legend, units and layout.

The steady-short-arrivals scenario has 32 jobs. FCFS mean wait is 26.15625 min, longest wait 27 min; SPT mean wait is 2.90625 min, longest wait 93 min. Both finish at minute 118. These are synthetic experimental observations, not real operational improvements.

Timings repeat each policy 50 times per scenario and report the median. Source hashes and exact UTC execution times are in `results/results.json`. This version does not implement ageing, deadlines, multiple benches or stochastic processing durations.
