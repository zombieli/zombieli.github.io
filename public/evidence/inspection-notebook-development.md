# Development record

Date: 2026-10-13. Version: 1.1.0. Scope: a self-contained mobile-first inspection notebook for fictional assets.

## 1. Define record and import invariants

The initial tests established empty draft defaults, protected identity/timestamps, required asset/condition/checklist fields, immutable submission, strict record fields and types, backup envelopes, duplicate conflicts, count/byte bounds and independent copies. A minimal export scaffold allowed the tests to load before behavior was implemented. The first in-process domain run reported **31 tests, 0 passed, 31 failed** (`evidence/domain-red.txt`). This was the expected missing-behavior stage.

Command: `node --test --test-isolation=none tests/core.test.mjs`. An initial process-isolated test invocation could not spawn child processes in the restricted environment. Running the supported in-process mode allowed the assertions to execute; that mode is the portable npm script's default. Normal environments can also run `node --test tests/*.test.mjs`.

## 2. Implement the pure core

Record validation was kept outside browser code. It rejects unknown fields, invalid identifiers, unknown equipment/conditions, nonboolean checklist entries, long notes and inconsistent canonical timestamps. Submission requires a selected asset/condition and all three checks. Updates accept only editable draft fields. The first implementation passed **31/31** tests.

A follow-up regression showed that JavaScript property coercion let an array containing a known condition name pass the condition lookup. The failing assertion is in `evidence/type-red.txt`. An explicit string check fixed this; the next run passed **32/32** tests. This matters at the JSON boundary because schema types must be checked before membership lookup.

## 3. Write browser scenarios before the interface

`tests/browser.mjs` defined the intended user actions and real IndexedDB/worker checks before the completed page existed. Its first run stopped at the absent empty-state element with a 30-second timeout. This established the unfinished browser state; the individual later browser scenarios were not all separately executed against missing implementations.

The runner uses isolated contexts, a local server at the deployment directory path and a separately installed Playwright package. `BASE_URL`, `PLAYWRIGHT_MODULE` and `CHROMIUM_PATH` make it reusable against local, staged or published copies. `scripts/browser-qa.cjs` is the reusable entry point. It never uses a personal browser profile.

## 4. Build storage and the notebook

The storage adapter uses real IndexedDB transactions and validates its own inputs. Imports use `add`, preserving existing records. Saves read the persisted record before applying a write so submitted records and stale draft edits are rejected at the storage boundary as well as in the interface.

The interface uses a navy header, teal actions and warm neutral surfaces. It offers a blank notebook, labelled fictional examples, totals, status filters, a complete draft editor, fixed submitted views, backup export/import, actual validation alerts and storage retry. Submitted fields are disabled. User text uses text nodes/input values. The page contains no remote runtime dependency.

The worker and manifest use relative URLs and a directory scope. PNG icons were created with a deterministic Node script, then decoded in Chrome to confirm their dimensions. A successful offline check waits for the worker to be active and controlling the page before network access is disabled.

The first full browser run passed **17 checks**, including draft reload, submitted reload, duplicate rollback, invalid import, download/restore, offline reload, status filtering, four widths, keyboard focus, stale-tab save rejection, icon/scope validation, unrelated-route isolation and an unavailable-storage presentation.

## 5. Strengthen transaction and boundary tests

The rollback fixture was expanded to place the conflicting ID between two new IDs. This observed a real defect: callbacks from subsequently aborted requests replaced the initial duplicate error with a generic import failure (`evidence/browser-rollback-red.txt`). The abort path now retains the first error and ignores repeated failure callbacks. A fresh browser run verifies neither new ID is inserted, the existing count is unchanged and the duplicate error survives.

A same-clock draft-save test failed because two edits could initially share `updatedAt` (`evidence/clock-red.txt`). Draft timestamps now advance by at least one millisecond; submission uses the later of the supplied clock and final edit time. This preserves optimistic conflict detection under rapid edits and small backward clock movements.

A maximum notebook with multibyte notes exposed that the initial 2 MB input limit could reject the application's own valid export (`evidence/capacity-red.txt`). An 8 MB trial handled multibyte text, but another failing regression showed that escaped control characters can require six JSON characters per note code unit (`evidence/escaped-backup-red.txt`). The final 16 MB limit permits the bounded worst case. A transaction-enforced 1,000-record notebook limit matches the backup record bound. Boundary tests verify 1,000 multibyte notes and 1,000 escaped notes can round trip, and a real browser transaction rejects the 1,001st record without inserting it.

## 6. Final measured verification

Commands: `npm test` (equivalent to `node --test --test-isolation=none tests/core.test.mjs`) and `node scripts/browser-qa.cjs` with the local Playwright/Chrome configuration. Final outputs and the structured summary are in `evidence/`. Exact counts and browser version are read from those output files.

Screenshots at 1440 and 390 pixels were visually inspected for readable hierarchy, aligned records/actions, wrapped backup controls and absence of horizontal overflow. The automated layout checks also cover 360 and 768 pixels, including open editor views. Keyboard checks exercise creation by Enter and forward focus into the condition group. These establish the recorded interactions, not a full assistive-technology audit.

## Limits and follow-up work

Verification uses desktop Chrome with resized viewports. No native-phone installation, native Android/iOS implementation, real equipment, production deployment load or physical offline network test is claimed. Storage-unavailable presentation is tested by deliberately removing the IndexedDB API; quota exhaustion and browser eviction are not reproduced. Notebook data is application-managed, not cryptographically sealed. It is intentionally bounded at 1,000 records and currently has no deletion UI. There is no background upload or synchronisation. Clearing origin data removes the notebook, so users must export records they want to keep.

Before future shell changes, increment the worker cache name and rerun the same browser scenarios. Before expanding the schema, define a migration policy and preserve backups rather than silently rewriting existing submitted records.

## 7. Review regression: typing while a write is pending

Review identified a data-loss race at the asynchronous save boundary. The original busy handling disabled buttons but left the form editable. A save captured a snapshot before awaiting IndexedDB; new typing while that transaction was blocked could then be replaced by the saved snapshot when the editor re-rendered.

A regression holds a real IndexedDB read/write transaction open using queued reads, starts the interface save and checks all editable fields while its write is queued. The first run failed the disabled-field assertion (`evidence/pending-write-red.txt`), confirming the missing lock before the fix. The same fixture also exercises submission. It attempts keyboard typing during the pending interval, releases the held transaction and compares both the displayed notes and persisted record with the intended snapshot. The save case requires draft fields to become editable again; the submission case requires them to remain read-only.

The fix disables every input, select and textarea while an action is pending, blocks closing the editor during that interval, and restores field state according to the record status afterward. The form now exposes `aria-busy`. A stronger keyboard assertion then showed that creation attempted to focus a still-disabled field (`evidence/pending-focus-red.txt`); creation now focuses the asset selector after the pending action releases its lock. The worker cache version was advanced to ensure previously cached clients receive the corrected shell. A separate local port was initially used because the standard demo port was occupied by verification; the final run returned to the standard port. The final rerun counts are recorded in `evidence/verification.json` and captured output.
