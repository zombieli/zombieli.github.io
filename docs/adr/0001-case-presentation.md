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
