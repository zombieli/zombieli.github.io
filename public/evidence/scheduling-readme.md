# Workshop Scheduling Study

A new, synthetic experiment comparing two dispatch rules for one workshop test bench. Jobs have release times and known processing durations. The bench handles one job at a time, without interruption, with a two-minute changeover between jobs.

This personal portfolio project uses a new workshop model and synthetic inputs. It does not reuse a previous vessel-scheduling project, real workshop data or historical optimisation results.

## Question and policies

How does choosing a short ready job affect average and longest waiting time?

- FCFS selects the ready job with the earliest release, breaking ties by job ID.
- SPT selects the shortest ready job, then release time and ID.

Both dispatch only jobs already released. If no job is ready, the clock advances to the next release. Neither rule uses future-arrival information. Neither is claimed to be globally optimal.

## Reproduce

```sh
python -m venv .venv
# Activate .venv for your shell
python -m pip install -r requirements-dev.txt
python -m pytest -q
python experiment.py
```

Python 3.12 is the tested version. The standard library implements scheduling and independent feasibility validation. Matplotlib generates the chart. The experiment writes `results/inputs.json`, `timelines.json`, `results.json`, `results.csv` and PNG/SVG charts. Re-running replaces these generated experiment files only.

The 20 mixed-arrival scenarios use seeds 0–19, 30 jobs each, release minutes uniformly drawn from 0–120 and durations from 2–25. Two additional deterministic scenarios expose steady arrivals of short jobs and a sparse queue. Both policies receive identical jobs and changeover constraints. Each dispatch is timed 50 times; the median is reported. Inputs and schedules are preserved for inspection.

## Validation and interpretation

The independent validator checks unique job coverage, release times, durations and non-overlap including changeover. Invalid schedules are rejected before metrics are computed. A deliberately designed steady-arrival case demonstrates why lower average waiting time can coexist with a worse longest wait. The chart retains that result.

Timings describe the local machine, not deployment performance. Processing durations are assumed known, with no uncertainty, breakdowns, operator availability, deadlines, travel or multiple benches. Results do not establish real operational savings. An ageing rule for fairness would be a separately specified follow-up experiment.
