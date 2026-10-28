# Development log

## 2026-10-08 Initial implementation

### Scope

The user requested a newly designed portfolio project, independent of old projects. The initial protocol therefore uses TCP loopback and synthetic data. Physical-device support was deferred explicitly; this is not a failed hardware validation.

### Implementation sequence

1. Defined `diagnostics-sim/1`, the status schema, lab validation ranges and diagnostic error codes.
2. Built a threaded simulator with 11 repeatable scenarios and a counter isolated by run/case ID.
3. Implemented a TCP adapter with a bounded frame and deadline, followed by strict JSON and response validation.
4. Added the runner, finite transport retries, expected-fault evaluation and per-attempt records.
5. Added staged JSON, CSV and event-log export, then a CLI for one-command and separate-process operation.
6. Added integration tests over TCP plus negative configuration, numeric validation, reporting and CLI tests.
7. Executed the full test suite and saved normal and intentionally failing demonstration runs.

### Environment and tooling issues

The bundled Python was 3.12.14. Creating the virtual environment inside the sandbox failed during ensurepip. It succeeded after execution was approved outside the sandbox. Installing pytest initially failed in the sandbox and succeeded in the project environment with approval. No global Python installation was modified.

The first pytest attempt reached 38 passing tests, but temporary-directory permission errors prevented six file-based tests from running and caused teardown failure. No application assertion failure was observed in that attempt. The same suite was rerun with approved access and a verified project-local temporary path.

### Verification

Command: `.venv\Scripts\python.exe -m pytest --basetemp .test-run-01 -q`

Observed result: **44 passed in 3.14s** on Windows with Python 3.12.14 and pytest 9.1.1. This is a test record, not a cross-platform claim.

Normal demonstration: **11 expectations passed**, including nine deliberately injected diagnostic faults. The recovery scenario disconnected on its first attempt and succeeded on its second.

Unexpected-failure demonstration: **10 passed, 1 failed**. Requiring a valid response from the missing-field scenario correctly failed and returned exit code 1. This failure is intentional evidence that unexpected defects are not silently accepted.

See the captured [normal console output](../evidence/normal-run.txt), [failure console output](../evidence/unexpected-failure-run.txt) and JSON/CSV/event files under `evidence/`. Exact run identifiers and source hashes are retained in those files.

### Next scope

Create a portfolio case study backed by the recorded results and a visual replay that explicitly identifies simulator evidence. GitHub publication and CI execution remain separate tasks. Physical-device testing is not included in this release.
