# Field Service Workflow design

New personal project, October 2026. This fictional workshop receives reports about demo terminals and gateways. A coordinator assigns a work order; a technician records a treatment note before resolving it. Closed records cannot be reopened. A resolved but unclosed record can return to Open, retaining the earlier history while clearing its active assignment and resolution.

## Implementation boundaries

The local version uses Vue, FastAPI and SQLite. The public static version uses an in-memory service in the browser tab. Refreshing or resetting the public demo creates two synthetic examples. No submitted demo data leaves the browser. `contract.json` supplies assets, status values, priority values and legal transitions to both implementations.

The backend implements `/assets`, `/work-orders`, `/work-orders/{id}`, `/work-orders/{id}/events` and `PATCH /work-orders/{id}/status`. Creation returns 201. Validation failures return 422; absent records 404; invalid transitions or stale versions 409. Errors contain `error.code` and `error.message`. API documentation is available at `/docs` while the local API runs.

## State and database

```text
Open -> Assigned -> In Progress -> Resolved -> Closed
                                  |
                                  +-> Open
```

Three SQLite tables store assets, current work orders and events. Event versions are unique per work order. UTC ISO timestamps are stored and the interface explicitly displays Australia/Perth time. API writes use parameterised SQL. Status changes use `BEGIN IMMEDIATE`, compare `expected_version`, update the record and insert its event in one transaction. A test deliberately rejects the event insert and confirms that both an update and a creation roll back.

Schema 0 is initialised to schema 1 in a transaction. Schema 1 is reused without deleting existing records. Other versions fail explicitly; no untested migration is attempted. There is no destructive reset endpoint. Local development can point `WORKFLOW_DB` at a new file for an independent database.

## Limits

Actor names are labels, not authenticated identities. This is a local portfolio application, without production authorisation, tamper-resistant audit storage, attachments or multi-tenant controls. The static demo is session-only and has no multi-user persistence. API and demo share transition rules, while API transaction guarantees are verified against SQLite separately.
