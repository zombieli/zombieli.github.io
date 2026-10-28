# Architecture

## Boundaries

`web/core.mjs` is a pure ES module shared by browser code and Node tests. It owns record schemas, bounded notes, draft editing, submission rules and versioned backup validation. It does not access the DOM, clocks, storage or network; callers supply IDs and timestamps. Returned records include copied checklist objects so callers cannot mutate the source through shared nested state.

`web/storage.mjs` owns the version-1 IndexedDB database `inspection-notebook-v1`, with one `records` object store keyed by `id`. Read results are validated before rendering. Corrupt or unsupported stored data produces an error without deleting anything. Draft changes use a single read/write transaction: read the current record, reject a submitted record, verify the expected update timestamp and original creation time, then put the new record. Draft timestamps advance by at least one millisecond to distinguish successive edits even when the clock reports the same instant. This detects stale saves across tabs; it does not automatically merge concurrent edits.

`web/app.mjs` handles DOM events and view state. It refreshes from IndexedDB after successful writes and displays success only after the transaction completes. A busy flag prevents duplicate concurrent UI actions. Every editable form control and the close action are disabled while persistence is pending, so the captured snapshot cannot diverge from later typing. Draft fields become editable again after completion or failure; submitted fields remain disabled. The form exposes its pending state with `aria-busy`. Text from notes and imported records enters the DOM through `textContent` or input `value`. Static form markup is built from fixed application labels. Submitted fields are disabled and editable actions are absent; storage separately rejects submitted-record writes.

## Atomic imports

The file size is checked before reading, and `parseBackup` validates its UTF-8 byte size, complete envelope, every record and duplicate identities before returning any records. Storage validates the records again at its own boundary. A read/write transaction checks the notebook capacity and queues only `add` operations. A duplicate ID invokes the same abort path as a storage failure. The first failure is retained; later aborted requests cannot replace it or abort an already-finished transaction. Nothing is resolved as successful until `oncomplete` fires.

The 1,000-record database bound matches the export/import record bound. The 16 MB file bound is deliberately above the worst case for 1,000 bounded notes represented as JSON escape sequences. No insertion policy silently skips duplicates, replaces IDs or overwrites existing data.

## Offline and installation

`manifest.webmanifest` defines a relative identity, start URL and `./` scope with real 192×192 and 512×512 PNG icons. `sw.js` precaches the application shell and all required modules, CSS, manifest and icons. Installation completes only after every precache request succeeds. Activation removes only old caches starting with `inspection-notebook-` and claims clients. Readiness is displayed after an active worker controls the page.

The fetch listener handles only same-origin GET requests whose URL lies within the registration scope. It reads only its own versioned cache. Missing resources use the network; failed navigation within the demo falls back to its cached index. Unrelated portfolio paths are outside the worker scope. No background sync, report upload or external API is registered. Future shell changes must also change the cache version to invalidate previous asset content.

## Interface

A labelled empty state and explicit fictional sample action make the initial data provenance clear. Status filters use pressed-state buttons. Native form controls, visible labels, keyboard focus outlines, a skip link, status/alert regions and responsive layouts support mouse and keyboard review. The editor moves above the record list on narrow screens. Draft saves are explicit; closing or leaving with unsaved edits prompts before discarding them. A storage failure disables write controls and offers a retry action.

## Limits

Persistence is local to a browser origin and can be removed by browser policy. Application-level read-only rules are not an audit security boundary against deliberate developer-tool changes. There is no deletion, authentication, multi-user merge, native-device integration or quota-management system. Desktop Chrome automation verifies the recorded scenarios; mobile-sized viewports do not establish physical-phone support. The offline-state check disables network access in a real browser context, while the unavailable-storage check deliberately disables the IndexedDB API to verify the error presentation.
