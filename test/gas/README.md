# Apps Script emulator (test/gas)

A zero-dependency, in-memory Google Apps Script runtime. It loads the **real**
`apps-script/*.gs` files (in filename order) plus a `PLANTILLAS` registry built
from `apps-script/*.html` exactly like `tools/empaquetar.js`, and runs them in a
Node `vm` realm. Suites: `test/integration.test.js` (part of `npm test`) and
`test/integration.known-bugs.test.js` (`npm run test:known-bugs`, expected to fail
until the bugs are fixed).

## Quick start

```js
const F = require('./gas/fixtures');           // scenario helpers (recommended)
const { createAccount } = require('./gas');     // raw API

const account = F.newAccount('2026-09-20T10:00:00-05:00');    // frozen clock
const prod = F.installProduction(account);   // runs INSTALAR -> { project, tokens, install }
const test = F.installTest(account);         // runs INSTALAR_PRUEBAS in a 2nd project, SAME account

prod.project.run('accionInscribir', F.uniqueSubmission(1));  // any global function
prod.project.records('REGISTRO');            // rows as objects (host values; Dates are host Dates)
prod.project.get({ p: 'admin', t: prod.tokens.admin }).body; // doGet -> { kind, body, title, output }
prod.project.post({ accion: 'config_publica' }).json();      // doPost, text/plain JSON by default
prod.project.clientCall('api', { accion: 'dashboard', t });   // google.script.run semantics (Dates -> null)
```

## Account (one Google user)

| API | What it does |
|---|---|
| `createAccount({ quiet, mailQuota, spreadsheetTimeZone, spreadsheetLocale, ownerEmail })` | New account. `quiet` (default `true`) keeps project `console` out of the test output. |
| `account.createProject(name, options)` | New Apps Script project (see below). |
| `account.setNow(iso \| Date \| ms \| null)`, `account.advance(ms)`, `account.nowMs()` | Controllable clock for `new Date()` / `Date.now()` in every project, cache expiry and Drive timestamps. `null` = real time. |
| `account.stubUrl(matcher, handler)` | Fake HTTP endpoint for `UrlFetchApp`. `matcher`: exact/prefix string, RegExp or predicate. `handler`: `{ code, body, headers }` or `(request) => that`. Body: string, Buffer, byte array or object (sent as JSON). Newest stub wins. Returns an unregister function. |
| `account.fetchLog` | Every request: `{ project, url, method, headers, payload, at }`. |
| `account.outbox`, `account.setMailQuota(n)`, `account.mailQuotaRemaining` | Mail sent by ANY project, and the shared daily quota (Google counts per user, not per project). |
| `account.drive.list(filter?)`, `account.drive.get(id)` | Drive inspection: `{ id, kind, name, mimeType, trashed, size, parents, createdBy, text }`. |
| `account.spreadsheet(id)` / `account.spreadsheets` | Spreadsheet stores: `.values(sheet)`, `.records(sheet)`, `.snapshot()`, `.findSheet(name)`, `.metadata`. |
| `account.findSpreadsheetsByName(name)` | All spreadsheets with that name. |

Built-in stubs: `https://docs.google.com/spreadsheets/d/<id>/export?format=xlsx|csv|pdf` returns the
export (a fake xlsx: `PK` + a JSON snapshot) when the `Authorization: Bearer <ScriptApp.getOAuthToken()>`
header is present. Without the token it redirects to the Google login page, which UrlFetch follows and
returns as **HTTP 200 HTML**, as Google does.

## Project (one Apps Script project)

`createProject(name, { sourceDir, mode: 'files'|'bundle', templates: true, deployed: true, containerSpreadsheetId, freshContextPerRun: true })`

- **Every `run()` is a new execution with fresh globals**, like Google (module-level caches do not survive
  between requests). Script Properties, caches, triggers, locks, Drive and spreadsheets persist.
- `run(fn, ...args)` - host arguments are deep-copied into the project realm.
- `execute(label, (globals, realm) => ...)` - arbitrary code inside ONE execution (e.g. edit a sheet by hand).
- `ctx` - globals of the last execution. `lastExecution.calls` - service-call counters (`Range.setValue`, `SpreadsheetApp.openById`, ...).
- `get(query)`, `post(body, { contentType, query })`, `request(method, opts)` - build the `e` event object like the web app.
- `clientCall(fn, ...args)` - `google.script.run`: illegal arguments throw; a return value containing a Date/function becomes `null`.
- `fireTrigger(handler)`, `triggers`, `missingTriggerHandlers()`.
- `scriptProperties` (Map), `scriptProperty(key)`, `spreadsheetId`, `spreadsheet()`, `records(sheet)`.
- `lockState.script` - `{ acquisitions, releases, nestedAttempts, maxDepth, leakedAtEnd }`; `simulateLockContention(true)` makes `tryLock` return `false`.
- `logs`, `logText()`, `warnings`, `warningsOf(type)`, `coercions` (per sheet/column: what Sheets turned into Date/Number/boolean), `openedSpreadsheets`.

Warning types worth asserting to be empty: `formula-from-string`, `template-printed-undefined`,
`unevaluated-scriptlet`, `lock-held-at-end`, `client-null-return`, `non-primitive-value`, `unknown-timezone`.

## Sheets fidelity (the reason this exists)

A STRING written with `setValue`/`setValues`/`appendRow` into a cell whose number format is not `'@'`:

| Written | Stored / read back |
|---|---|
| `'2026-10-02'`, `'2026-10-02 18:00'` | Date (spreadsheet time zone) |
| `'16:00'`, `'16:00:00'`, `'4:00 PM'` | time value = Date 1899-12-30 16:00 (LMT offset in Bogota, as in Java) |
| `'1036448960'`, `'0012'`, `'3.5'`, `'1,234'`, `'50%'` | Number (leading zeros lost) |
| `'TRUE'` / `'false'` | boolean |
| `"'0012"` | text `0012` |
| `'=...'` | formula (value `#FORMULA!`, never evaluated; warning `formula-from-string`) |
| `'+57 301 ...'`, `'- text'` | formula parse error `#ERROR!` (Google's behaviour, not re-verified live) |
| `'2026-10-01T18:00:00-05:00'`, anything with a `T` separator, other text | text |

With `setNumberFormat('@')` applied BEFORE writing, strings are stored verbatim. Numbers in a
date-formatted cell read back as Dates, and `clearContent()` keeps formats. Also enforced:
setValues dimension errors, "at least 1 row", 50,000 chars per cell, 10M cells, "cannot delete all
non-frozen rows", "cannot hide all sheets", developer-metadata visibility (PROJECT = creator only),
row-group depth (max 8) with collapse/expand.

## Known limitations

- Formulas are stored, never computed. Short date forms such as `'1-5'` (Google: 5 Jan) are not parsed;
  number parsing follows en_US; `M/D/Y` vs `D/M/Y` follows `spreadsheetLocale` (`es*` = day first).
- One process time zone (America/Bogota, set on load): local-time `Date` methods use it for every project.
- Single-threaded: no real concurrency. Lock contention is simulated on demand.
- LockService: a nested `tryLock` in the same execution succeeds (counted in `nestedAttempts`) and any
  `releaseLock` frees it - modelled on Google, not documented by Google.
- `getDocumentLock`/`getDocumentProperties`/`getDocumentCache` return `null` for standalone projects (Google's
  behaviour; the brief asked for a lock). Pass `containerSpreadsheetId` to get a bound script.
- Contextual escaping of `<?= ?>` is a compile-time approximation (HTML, JS string, JS code); URL/CSS
  contexts are HTML-escaped.
- No quotas besides mail and triggers (20 per project); no execution-time limit; call counters are the proxy.
- Drive: `searchFiles` understands `title/name =|contains`, `trashed`, `'<id>' in parents`, `mimeType`.
- Not implemented: GmailApp, DocumentApp, FormApp, advanced services, `Utilities.zip/unzip`, RSA signing.
