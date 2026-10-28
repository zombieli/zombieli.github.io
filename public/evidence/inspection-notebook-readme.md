# Offline Inspection Notebook

A mobile-first, device-local notebook for **fictional training equipment**. Create a draft, select an asset and condition, complete three checks, then submit a read-only record. No account, server database, upload or equipment connection is used.

The complete static demo is in `web/`. Copy that directory to `/demos/inspection-notebook/`; assets and install URLs are relative. The service worker controls only its own directory. HTTPS or localhost is required for offline caching and installation support.

## Run and test

Use Node.js 24. The application and unit tests have no external runtime dependencies.

```sh
npm test
npm run serve
```

Open `http://127.0.0.1:4175/demos/inspection-notebook/`. The server deliberately uses the deployment path so relative assets and worker scope can be checked locally. `PORT` selects another port. No build step or package installation is needed for the demo.

The equivalent unit command is `node --test tests/*.test.mjs`. The npm script runs in-process test isolation for restricted execution environments.

Browser QA uses a separately available Playwright installation and desktop Chrome. Set `PLAYWRIGHT_MODULE` to that installation's directory or `index.mjs`, and optionally `CHROMIUM_PATH` to your Chrome executable. These are test dependencies; the static application uses neither. If Playwright is resolvable normally, `PLAYWRIGHT_MODULE` can be omitted and the installed Chrome channel is used.

```sh
node scripts/browser-qa.cjs
```

The runner starts the local server itself. To check a staged or published directory instead, set `BASE_URL` to its full URL with a trailing slash. It uses isolated browser contexts and writes measured results and screenshots into `evidence/`.

## Record and backup format

Each record has exactly these fields:

```json
{
  "id": "training-record-1",
  "status": "draft",
  "assetId": "TRN-101",
  "condition": "watch",
  "checks": { "isolation": true, "housing": false, "indicators": false },
  "notes": "Fictional training observation.",
  "createdAt": "2026-10-13T09:00:00.000Z",
  "updatedAt": "2026-10-13T09:01:00.000Z",
  "submittedAt": null
}
```

Backups wrap an array of records in `{ "schemaVersion": 1, "exportedAt": "<canonical ISO UTC timestamp>", "records": [] }`. IDs contain 1–80 ASCII letters, digits, underscores or hyphens, starting with a letter or digit. Drafts may have empty asset/condition values and unchecked items. Assets are `TRN-101`, `TRN-204`, `TRN-305`; conditions are `acceptable`, `watch`, `unsafe`. Notes contain at most 2,000 UTF-16 code units. Timestamps must be canonical ISO UTC values and updates cannot precede creation. Submitted records require all fields and checklist items, with `submittedAt` equal to `updatedAt`.

Unknown/missing fields, invalid types, unsupported versions, repeated IDs, malformed JSON, files over 16 MB and notebooks over 1,000 records are rejected. The byte bound accommodates a complete notebook even when notes need JSON escape sequences. Validation finishes before insertion. IndexedDB `add` requests run in one read/write transaction; any existing ID or storage error aborts the entire transaction. Identical existing IDs are also conflicts. No import overwrites a record.

## Review the workflow

1. Begin with an empty notebook, or explicitly choose **Load fictional examples** to add two training records.
2. Choose **New inspection**. An empty draft is persisted immediately. Edits persist when **Save draft** is selected.
3. Try submission with missing fields; the page displays the actual validation error. Select an asset and condition, check all three items, then submit.
4. Reload to review the read-only record. After offline access is ready, disconnect and reload again.
5. Export JSON. Import into a fresh browser profile to restore it. Reimporting into the same notebook produces a duplicate conflict with no changes.

## Evidence and boundaries

`evidence/verification.json` summarises the recorded checks. `evidence/domain-green.txt` and `evidence/browser-green.txt` contain final test output. Red-stage files preserve observed failures with local path prefixes removed. `evidence/notebook-1440.png` and `evidence/notebook-390.png` show the inspected layouts. Architecture and implementation details are in `docs/`.

This is a desktop-Chrome-tested PWA demonstration, not a tested native Android/iOS application. Browser profiles, domains and ports have separate storage. Offline caching requires an initial successful online load; clearing site data removes records and cached assets. Export important records. No device installation prompt, physical equipment, production use, multi-user synchronisation, quota exhaustion or native-phone behavior is claimed. The notebook retains at most 1,000 records and has no deletion workflow. Browser developer tools can modify local storage; read-only submission is an application invariant, not cryptographic tamper protection.
