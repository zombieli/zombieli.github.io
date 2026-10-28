# Case presentation and profile ownership

Date: 2026-10-13
Status: Accepted for 1.2

## Context

The site now has three standard and three specialised cases. The shared App previously owned all diagnostics request state, unchecked report data, scenario selection and case markup alongside navigation and homepage content. Build verification searched that same file for profile strings, coupling personal facts to presentation placement.

## Decision

Keep the existing static routes and Vue framework. App owns the common frame and page selection. The home module consumes a shared profile record. Each specialised case owns its interaction; the diagnostics module loads and validates evidence through a small response interface, handles timeout/retry and presents the full case even when evidence is unavailable. Case modules load on demand.

The evidence response is the seam where external data enters presentation. Validation covers the fields actually consumed by the viewer, including metadata, scenarios and attempts. Existing downloadable reports are unchanged. Contract tests reject unusable data and browser checks exercise recovery through the rendered interface.

Profile verification reads the shared record rather than searching Vue source files. Confirmed values remain explicit regression checks; when the candidate confirms a changed fact, update both the record and its confirmed-value check.

## Consequences

Moving or styling the homepage no longer changes diagnostics behaviour or breaks profile checks. The diagnostics module has depth: removing it would force the frame to absorb loading, validation, state and evidence presentation again. The response interface gives tests a stable surface and keeps failure handling local.

Keep the catalogue generation module and filter URL rules intact. They already support content authoring with meaningful lifecycle tests. A separate history adapter or plugin registry has no second consumer and would add interfaces without demonstrated leverage.

## Inspection journey extension · 27 October 2026

The notebook now has a dedicated lazy presentation, selected by its existing project ID before the generic standard renderer. Its catalogue record keeps `renderer: standard` and the complete structured case, preserving the authoring and generated-route contract. App applies initial-fragment restoration to this view, as it does to the original three specialised cases. In-memory record and recovery examples share the original notebook core validation; the real demo retains its own IndexedDB and service-worker scope.

The comparator follows the same project-ID selection pattern in `DeltaCase.vue`. It shares the original pure comparison core and exact sample reports while keeping the file-selection application unchanged. Source/provenance tests compare the page result against the saved artifact. A separate in-memory model explains the original per-slot read guards.

`ManualCase.vue` applies the same pattern to Technical Manual Search. Its ranking core and corpus are unchanged copies of the source project; URL serialization uses the original state module, and highlighting preserves exact source text through Vue text interpolation. The evaluation diagram displays the saved 26-query report. Tests use the original evaluator with an adapted local import to verify every metric and row. The generic standard renderer remains available for newly authored projects; the catalogue and generator contract is unchanged.
