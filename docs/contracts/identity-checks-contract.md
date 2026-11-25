# PBL Identity Checks: service contract

Version `1.0`. Approved at: *(awaiting owner approval)*.

Changes from the brief's draft (section 4) are listed in section 10.

---

## 1. How a caller reaches the service

**Service callers (the CRM, Hiring app, Email app and so on).** Every outside caller
reaches the service this way:

- A caller obtains a token from Isomorph using its **service credential** (OAuth 2.0 client
  credentials flow). The token expires after one hour; callers refresh it before it expires.
- Every call: `POST <app's API address>/_harbour/api/<action>`
  with `Authorization: Bearer <token>`.
- Each credential is allowed named actions only. Isomorph refuses any other action with
  `403` before the action runs.
- Isomorph checks the request body against the action's JSON Schema for outside callers
  (400 on mismatch). Each action also checks its own input, because Isomorph skips that
  check for builders calling from inside the app.
- Inside the action, the caller's identity is `service:<clientId>`. All settings, limits
  and call-log entries use this identity.

**Builders calling from inside the app.** A PBL builder who has signed into the dev app
can also reach the actions (for development and debugging). Their rules are different
and stricter:

- The action sees the caller as `builder:<email>` (the Isomorph builder identity), not
  as a service credential.
- **Builders may call the actions only with `register: "practice"`.** A builder
  request that names `"surepass"` is refused before any register call, with outcome
  `NOT_SET_UP` and reason "Identity checks with SurePass are not set up for this
  caller." No caller-settings record changes this — the rule is wired into the
  contract. See fixture `check-pan/not-set-up-builder.json`.
- A builder's call still passes through the action's own input validation (same rules
  as every service call) and is still recorded in the call log, with `caller =
  builder:<email>`.
- Real-number tests of SurePass (brief section 5, step 6) therefore always use a
  **service credential** with a daily limit — never a builder's identity. A builder's
  click can never spend SurePass money.

---

## 2. Actions

| Action | Does | Charged? |
| --- | --- | --- |
| `check-pan` | One PAN: its registered name and holder type | When SurePass is called |
| `check-gstin` | One GSTIN: its registration | When SurePass is called |
| `gstins-by-pan` | Every GSTIN registered under one PAN | When SurePass is called |
| `get-check` | One earlier check of this caller, by `check_id` or `request_id` | Never |
| `my-usage` | This caller's paid and practice checks today, and its limits | Never |

---

## 2a. `get-check` and `my-usage`

### `get-check`

Request: one field, `check_id` (a UUID) or `request_id` (the caller's key). Not both.

```json
{ "check_id": "00000000-0000-0000-0000-000000000001" }
```

Response (200): the check record, in the same shape as section 4. Every completed check
record is retrievable, whatever its outcome — `NO_ANSWER`, `NOT_SET_UP`, `LIMIT_REACHED`
and `REFUSED_INPUT` checks are stored and can be looked up. `replayed` reflects whether
the original check was itself a replay, as recorded — it is not reset to `false` by the
lookup. An `IN_PROGRESS` placeholder (section 7.2) is not a completed check and is never
returned.

Response (404): error body (section 6, error response body).

### `my-usage`

Request: no body (or an empty JSON object).

Response (200):

```json
{
  "contract_version": "1.0",
  "caller": "service:crm-server",
  "date": "2026-11-20",
  "surepass": {
    "invocations_today": 5,
    "daily_limit": 100
  },
  "practice": {
    "invocations_today": 12,
    "daily_limit": null
  }
}
```

- `caller`: the caller's identity (`service:<clientId>`).
- `date`: today's India date (`YYYY-MM-DD`, Asia/Kolkata).
- `surepass`, `practice`: each register's invocation count and limit.
  `invocations_today` counts new calls that reached the register today (excluding
  replays, reuses, and calls refused by `LIMIT_REACHED`); for SurePass this equals
  the number of charged calls. `daily_limit` is `null` when no limit is set.

---

## 3. What a check takes

```json
{
  "request_id": "caller's own key for this request, 8 to 64 characters",
  "pan": "AAACP7361R",
  "register": "surepass",
  "accept_kept_answer_days": 0
}
```

**Fields:**

- `request_id` (required, string, 8–64 characters): the caller's own key. Alphanumeric,
  hyphens and underscores only. Must be unique per caller within the service (a second
  call with the same id and the same request replays the first answer; with a different
  request, 409).
- `pan` (required for `check-pan` and `gstins-by-pan`): the PAN to check. Upper case,
  no spaces. Format: exactly 10 characters — positions 1–5 uppercase letters, 6–9
  digits, 10 an uppercase letter. Any value that does not match is refused with 400
  before anything is paid for.
- `gstin` (required for `check-gstin`): the GSTIN to check. Upper case, no spaces.
  Format: exactly 15 characters. Characters 3–12 must be a valid PAN (by the PAN format
  above). Character 15 must be the check character computed from characters 1–14 (the
  GST network's check-character algorithm; see section 8 and `accounts/identity_checks.py`). Any value that fails is
  refused with 400 before anything is paid for.
- `register` (required, one of `"surepass"` or `"practice"`, lowercase): which register
  to use. A caller may use only the registers its settings allow (section 6). The
  response field `register` is the uppercase form of this value (`"SUREPASS"` or
  `"PRACTICE"`).
- `accept_kept_answer_days` (optional, integer 0–366, default 0): when greater than 0
  and the same register already gave a `FOUND` or `NOT_FOUND` answer for the same number
  within that many days, the service returns that answer with `reused: true` and pays for
  nothing. `0` means "check now". The caller decides; the service never decides that an
  old answer is good enough on its own.
- `pan` is the number field for `check-pan` and `gstins-by-pan` only; it is forbidden
  in `check-gstin` (400). `gstin` is the number field for `check-gstin` only; it is
  forbidden in `check-pan` and `gstins-by-pan` (400).
- **Any other field not listed above is refused with 400.**

**Whose kept answers may be reused.** Under `accept_kept_answer_days`, the service may
reuse **any caller's** earlier `FOUND` or `NOT_FOUND` answer on the same register for
the same number, not only this caller's. The owner decided this on 21 November 2026:
the registered name and status of a number is the same for everyone, so paying twice
for the same answer is waste. **What stays per caller:**

- Each caller's check records and call log are its own. `get-check` only returns the
  caller's own checks; a `check_id` from another caller is `404`. `my-usage` only
  counts this caller's invocations.
- The 60-second double-click rule below applies per caller (two different callers
  within 60 seconds each pay their own call, unless one is reused under `accept_kept_answer_days`).
- The reused answer's **`check_id` is always this caller's new id**, never another
  caller's (per section 4).

**Double-click protection.** A fresh check of the same number on the same register within
60 seconds of this caller's own `FOUND` or `NOT_FOUND` answer returns that answer with
`reused: true`, counting as one paid call. This applies even when
`accept_kept_answer_days` is 0, and is per caller.

---

## 4. What a check answers

Every check returns HTTP `200` with an outcome, whatever the register did. A failed
register call is an outcome, not an HTTP error.

```json
{
  "contract_version": "1.0",
  "check_id": "uuid",
  "request_id": "as sent",
  "replayed": false,
  "kind": "PAN",
  "number": "AAACP7361R",
  "register": "SUREPASS",
  "outcome": "FOUND",
  "reason": null,
  "answer": {
    "registered_name": "PRACTICE CRANES PRIVATE LIMITED",
    "holder_type": "COMPANY"
  },
  "register_reference": "SurePass's own reference for this answer (its client_id), or null",
  "register_time": "2026-11-20T10:15:01Z",
  "answered_at": "2026-11-20T10:15:01Z",
  "checked_at": "2026-11-20T10:15:01Z",
  "reused": false,
  "charged": true
}
```

**Response fields:**

- `contract_version`: always `"1.0"` for this version of the contract.
- `check_id`: a UUID assigned by the service to this check record.
- `request_id`: the value sent in the request.
- `replayed`: `true` when the same `request_id` with the same request was sent earlier
  by this caller, and this response is that first answer unchanged.
- `kind`: `"PAN"`, `"GSTIN"` or `"GSTINS_BY_PAN"`.
- `number`: the number checked, upper case.
- `register`: `"SUREPASS"` or `"PRACTICE"` (always uppercase).
- `outcome`: one of the outcome codes below.
- `reason`: a plain-English sentence when the outcome is not `FOUND`, otherwise `null`.
- `answer`: the check's answer when the outcome is `FOUND`, otherwise `null`. Shape
  depends on `kind` (see section 5).
- `register_reference`: the register's own reference for this answer (SurePass's
  `client_id`), or `null` if the register returned none. **The practice register
  always returns `null`.** On a reused answer this is the ORIGINAL register's
  reference, unchanged — never `null` simply because the answer was reused (so a
  reused SurePass answer still carries the original SurePass reference, while a
  reused practice answer stays `null` because the original was `null` too). On a
  replay (same `request_id`) it is the stored reference from the first answer.
- `register_time`: the time the register produced the answer, as an ISO 8601 string
  in UTC, or `null` when the register did not provide one. **The practice register
  always returns `null` here**; SurePass's HTTP Date header is used when present. On
  a reused answer this is the ORIGINAL register's time, unchanged (so a reused
  practice answer stays `null`; a reused SurePass answer carries the original Date).
- `answered_at`: the time the register first gave this answer, ISO 8601 in UTC.
  **Never null.** For a **new check** this is captured when the register result is
  received, so it is **≥ `checked_at`** (equal only when the answer is instant; for a
  slow register call such as `ZZZZT9004Z` it is the full response-time later). For a
  **reused** answer this is the ORIGINAL check's `answered_at` — the caller uses this
  to work out how old the answer really is. For a **replay** it is the first
  answer's `answered_at`, carried unchanged. For non-answer outcomes (`NO_ANSWER`,
  `NOT_SET_UP`, `LIMIT_REACHED`, `REFUSED_INPUT`) this equals `checked_at` (no
  earlier answer exists).
- `checked_at`: the time the service **accepted** this request, ISO 8601 in UTC. Set
  once at the moment the request arrives at the action and never changed after. On a
  reused answer, `checked_at` is "today" while `answered_at` is the original day; the
  gap between them is the age of the reused answer.
- `reused`: `true` when an earlier answer for the same number was returned
  (`accept_kept_answer_days` or the 60-second double-click rule), without a new
  register call.
- `charged`: `true` when a paid SurePass call was made for this check. Always `false`
  for practice-register checks (no money is spent). A `NOT_FOUND`, `NO_ANSWER`,
  `REFUSED_INPUT` outcome from SurePass is still charged if SurePass was actually
  called. `LIMIT_REACHED`, `NOT_SET_UP`, replays and reuses are never charged.
  Practice-register calls count against the practice daily limit but are never charged.

**On the `check_id` of a reused answer.** A reused answer always carries a **new**
`check_id` (this caller's new check record), not the original's — because the
original check may belong to another caller and other callers' `check_id`s are never
exposed (per the owner's decision on who may reuse what, sections 3 and 4). The
service's internal call log records which earlier check was reused so the paid call
remains traceable end-to-end.

---

## 5. Answers by kind

Only `FOUND` and `NOT_FOUND` are answers about the number. Every other outcome means "no
answer yet" — it is **never eligible for kept-answer reuse** (`accept_kept_answer_days`
and the 60-second rule do not apply to it) but its check record is stored and
retrievable via `get-check`.

### 5.1 Outcomes

| Outcome | Means | `reason` (names the register in plain English) |
| --- | --- | --- |
| `FOUND` | The register holds the number; `answer` is filled | `null` |
| `NOT_FOUND` | The register has no record of the number | `"SurePass has no record of this number."` / `"The practice register has no record of this number."` |
| `NO_ANSWER` | The register did not answer: down, slow or busy | `"SurePass did not answer. Check again later."` / `"The practice register did not answer. Check again later."` |
| `NOT_SET_UP` | No key, the key was refused, or this register is not allowed for this caller | `"Identity checks with SurePass are not set up for this caller."` / `"Identity checks with the practice register are not set up for this caller."` |
| `LIMIT_REACHED` | This caller's limit for today on this register is used up; nothing was called | `"Today's limit of SurePass checks is used up. Check again tomorrow."` / `"Today's limit of practice checks is used up. Check again tomorrow."` |
| `REFUSED_INPUT` | The register refused the request itself | `"SurePass refused the request. Please tell support."` / `"The practice register refused the request. Please tell support."` |

### 5.2 PAN answer (`check-pan`)

```json
{
  "registered_name": "PRACTICE CRANES PRIVATE LIMITED",
  "holder_type": "COMPANY"
}
```

- `registered_name`: the name the Income Tax Department holds for this PAN. Never null
  when the outcome is `FOUND`.
- `holder_type`: one of `COMPANY`, `PERSON`, `HUF`, `FIRM`, `ASSOCIATION_OF_PERSONS`,
  `TRUST`, `BODY_OF_INDIVIDUALS`, `LOCAL_AUTHORITY`, `ARTIFICIAL_JURIDICAL_PERSON`,
  `GOVERNMENT`, or `null` when neither SurePass's category nor the PAN's 4th letter
  maps to a known type.

The holder type is read from SurePass's `category` field first; if absent or unmapped,
it falls back to the PAN's 4th letter using the standard Income Tax mapping:

| 4th letter | Holder type |
| --- | --- |
| C | COMPANY |
| P | PERSON |
| H | HUF |
| F | FIRM |
| A | ASSOCIATION_OF_PERSONS |
| T | TRUST |
| B | BODY_OF_INDIVIDUALS |
| L | LOCAL_AUTHORITY |
| J | ARTIFICIAL_JURIDICAL_PERSON |
| G | GOVERNMENT |

### 5.3 GSTIN answer (`check-gstin`)

```json
{
  "legal_name": "PRACTICE CRANES PRIVATE LIMITED",
  "trade_name": "PRACTICE CRANES",
  "registration_status": "Active",
  "is_active": true,
  "registered_address": "Plot 12, Practice Industrial Estate, Vadodara, Gujarat, 390010",
  "constitution_of_business": "Private Limited Company",
  "taxpayer_type": "Regular",
  "registered_on": "2017-07-01",
  "cancelled_on": null
}
```

- `legal_name`, `trade_name`, `registered_address`, `constitution_of_business`,
  `taxpayer_type`: strings as the GST network holds them, or `null`.
- `registration_status`: the status as the GST network words it (e.g. `"Active"`,
  `"Cancelled"`, `"Suspended"`), or `null`.
- `is_active`: `true` when `registration_status` is `"Active"` (case-insensitive).
- `registered_on`, `cancelled_on`: dates as `"YYYY-MM-DD"` or `null`.
  SurePass's sentinel "no date" value `1800-01-01` is read as `null`.

### 5.4 GSTINs by PAN answer (`gstins-by-pan`)

```json
{
  "gstins": [
    {
      "gstin": "24AAACP7361R1ZW",
      "state_code": "24",
      "state_name": "Gujarat",
      "registration_status": "Active",
      "is_active": true
    }
  ]
}
```

- `gstins`: a list of zero or more items. An empty list (`[]`) is a valid `FOUND`
  answer meaning the PAN has no GSTIN registrations. `null` or a missing list from the
  register is `NO_ANSWER`, not `FOUND`.
- `state_code`: the two-character GST state code (characters 1–2 of the GSTIN).
- `state_name`, `registration_status`: strings as the register holds them, or `null`.
- `is_active`: `true` when `registration_status` is `"Active"` (case-insensitive).

**Guard:** an answer whose GSTIN list includes a GSTIN whose characters 3–12 are not
the PAN asked is `NO_ANSWER`, never `FOUND`. SurePass must not cross numbers.

---

## 6. Refusals: nothing checked, nothing charged

| HTTP status | When |
| --- | --- |
| 400 | Wrong shape: unknown field, wrong type, a `request_id` outside 8–64 characters, a malformed PAN or GSTIN, a GSTIN whose check character does not fit |
| 401 | No credential, or a wrong or expired token (Isomorph) |
| 403 | The action is not allowed for this credential (Isomorph); or a signed-in person who is not a builder |
| 404 | `get-check`: no such check for this caller (a caller never reads another caller's checks) |
| 409 | The same `request_id` was sent earlier by this caller with a different request (different kind, number, register or `accept_kept_answer_days`) |

**Same request again.** The same `request_id` with the same request (same kind, number,
register and `accept_kept_answer_days`) returns the first answer with `replayed: true`,
nothing new paid or written (no new check record, no new provider call, no new charge).
The replay itself is recorded in the call log (section 7.4). To check again after
`NO_ANSWER`, the caller sends a new `request_id`. Two identical requests at the same
moment produce at most one provider call and one replayed response (see section 7.2 for
the narrow crash exception).

**Error response body.** Every refusal from an action (400, 403, 404, 409) returns JSON:

```json
{ "error": "<code>", "message": "<plain English, no internal detail>" }
```

Codes: `bad_request` (400), `forbidden` (403), `not_found` (404), `conflict` (409).
The `message` says what was wrong in plain English. It never carries a stack trace,
a database message, a key, a number or a provider's reply. 401 responses come from
Isomorph directly and may have a different shape.

---

## 7. Callers, settings, limits and the call log

### 7.1 Callers' settings

One settings record per credential (`service:<clientId>`):

- `name`: a human-readable name for this caller (e.g. `"CRM server"`).
- `registers_allowed`: which registers this credential may use (each of `surepass`,
  `practice`). A caller with no settings record may use the practice register only.
- `daily_limit_surepass`: maximum SurePass checks per India day (midnight–midnight
  Asia/Kolkata). `null` means no limit.
- `daily_limit_practice`: maximum practice checks per India day. `null` means no limit.

### 7.2 Request-slot claim (concurrent safety)

The service enforces "one paid call per identical request" using a per-`(caller,
request_id)` claim with a token. **Different `request_id`s from the same caller are
different requests** — they claim different slots and do not coalesce, even for the
same number and register. The 60-second double-click rule (§3) and
`accept_kept_answer_days` cover the cross-`request_id` cases.

Before calling the provider or reading any kept answer, the service claims a slot:

1. **Claim transaction.** Insert a placeholder check row (internal state `IN_PROGRESS`,
   not a contract outcome and never returned to callers) under the
   `(caller, request_id)` unique constraint and commit immediately. The claim carries
   a **claim token** (a fresh UUID) stored on the row.
   - If the insert **conflicts with a finalised row** (any terminal outcome): same
     request body → returns the existing answer with `replayed: true`; different
     request body → returns 409.
   - If the insert **conflicts with an `IN_PROGRESS` row** (the first request is still
     running): the conflicting request polls for up to **45 seconds** for the row to
     reach a terminal outcome, then replays the finalised result. If the row is still
     `IN_PROGRESS` after 45 seconds it is treated as stale; the conflicting request
     **takes the claim atomically** by `UPDATE row SET claim_token = <my new token>
     WHERE state = 'IN_PROGRESS' AND claim_token = <the stale token I observed>`.
     Exactly one concurrent waiter's CAS succeeds; the losing waiters resume polling
     and ultimately replay the row the winner finalises.

2. **Result transaction.** After the provider call returns — or after any terminal
   path that does not call the provider (reuse, `LIMIT_REACHED`, `NOT_SET_UP`) — the
   action finalises the placeholder with an atomic CAS: `UPDATE row SET state =
   'TERMINAL', outcome = <outcome>, … WHERE claim_token = <my token>`. The result
   transaction is a short write with its own **5-second budget**; if it exceeds that,
   the request treats the row as failed, leaves it IN_PROGRESS for the next request's
   takeover, and returns `NO_ANSWER`.

   If the CAS fails because the token has changed (the claim was taken over as stale),
   the original request waits **up to 45 seconds more** for the new claimant to
   produce a terminal row, then replays that answer. If after that wait the row is
   still `IN_PROGRESS` (the new claimant also crashed or exceeded its budget), the
   original request itself **atomically finalises the row as NO_ANSWER**: `UPDATE row
   SET state = 'TERMINAL', outcome = 'NO_ANSWER', register_time = null, answered_at =
   checked_at WHERE state = 'IN_PROGRESS' AND claim_token = <the stuck successor's
   token>`. If this CAS succeeds the response carries that row's `check_id`, now
   terminal and retrievable. If the CAS loses (the successor finalised one instant
   before), the original reads the terminal row and returns that answer as a replay.
   Either way, the returned `check_id` points at a durable terminal row — never at an
   IN_PROGRESS row.

**Timing bound.** The 45-second claim wait is strictly greater than every honest live
path, with explicit numerical bounds on each step:

| Step the live request may wait on   | Hard bound                                     |
| ---                                  | ---                                            |
| Daily-count lock inside §7.3         | 5 s (Isomorph's lock-wait maximum, D-05)       |
| Provider call (SurePass)             | 20 s (§9 timeout)                              |
| Result write (short transaction)     | **5 s** (enforced; over-budget → NO_ANSWER)    |
| **Honest-path total**                | **30 s**                                       |
| **Stale-claim wait before takeover** | **45 s** (strictly greater, 15 s margin)       |

This is deliberately spelled out in DESIGN.md D-06 so any later change to one of the
step bounds (for example, a longer provider timeout) forces a corresponding change to
the claim wait. Isomorph limits an action to 5 minutes; the worst case (own call +
45 s second wait + the atomic NO_ANSWER finalise) fits well inside this.

**Callers should show a loading indicator on their own screen while waiting:** a PAN
check can take up to about 30 seconds, and a request that lost its claim and waited
again can take up to about 90 seconds in total.

`get-check` never returns an `IN_PROGRESS` row; a placeholder is not a completed check
record. Outside the narrow crash window (a provider call that succeeds but whose
result transaction then aborts), two identical concurrent requests produce at most one
provider call whose answer is kept. In that window, a provider call may occur without
a durable record; this unavoidable uncertainty is acknowledged here. If SurePass
offers no idempotency key, the caller should send a new `request_id` to check again.

### 7.3 Daily limits

- Counts **new invocations** per caller, per register, per India day — calls that reached
  the register, excluding replays, reuses, and calls refused by `LIMIT_REACHED`.
- Two checks arriving at the limit simultaneously: exactly one passes, the other gets
  `LIMIT_REACHED`. This is a behaviour of the service; how it is implemented (a short
  database transaction that holds a lock only to read and increment the count, and
  releases it before the provider call) is in `docs/DESIGN.md` D-05.
- The practice register has a daily limit too, so the limit can be tested without paying.

### 7.4 The call log

Every call that reaches an action is recorded in the call log — one row per
invocation attempt. The call log is a separate store from check records (see
`docs/DESIGN.md` D-13); it has **no** unique constraint on `(caller, request_id)`, so
it can hold replays, action refusals, builder calls and successful calls side by side.

| Field | Description |
| --- | --- |
| caller | `service:<clientId>` for an outside service caller, or `builder:<email>` for a builder call from inside the app (§1) |
| action | e.g. `check-pan` |
| `request_id` | as sent, or `null` for a refusal where the field was absent or invalid |
| kind | `PAN`, `GSTIN` or `GSTINS_BY_PAN`, or `null` for a refusal where the field was absent or invalid |
| number | the number checked (stored; masked to last 4 characters on the builders' page), or `null` for a refusal where the field was absent or invalid |
| register | `SUREPASS` or `PRACTICE`, or `null` for a refusal where the field was absent or invalid |
| outcome | the outcome code, or `null` for an action-refusal entry (see the two-path rule below) |
| `charged` | whether a paid SurePass call was made (never true for practice; false for refusals, replays, reuses) |
| `reused` | whether an earlier answer was returned |
| `replayed` | whether the `request_id` was seen before |
| `check_id` | UUID of the check record this entry refers to (same value for a replay; `null` for an action-refusal entry) |
| register reference | SurePass's reference for the register's answer (on a reused answer: the **original** reference; on a replay: unchanged from the first answer) |
| `register_time` | when the register gave the answer (original time on reused/replayed; `null` for practice; `null` for a refusal or non-answer outcome) |
| `answered_at` | when the register first gave this answer (equals `checked_at` for a new check or non-answer; the original check's time on reused) |
| reused_from_check_id | internal: on a reused answer, the `check_id` of the original paid check (never exposed to callers) |
| time taken | milliseconds |
| `checked_at` | ISO 8601 UTC — when **this** request was accepted |

**Replays are logged.** When a request is a replay, a new call-log entry is written with
the original `check_id`, `replayed: true`, `register_reference` unchanged from the first
answer, and `charged: false`. No new check record is created; "nothing new written" in
section 6 refers to no new check record, no new provider call, and no new charge.

**Two paths for input-validation refusals:**

- Requests rejected by Isomorph's JSON Schema check (`expose.input`) before the action
  runs are **not logged** by the action (the action is never reached). This applies to
  external callers only.
- Requests rejected by the action's own input validation (which runs for all callers,
  including builders) **are logged** as an action-refusal entry with `outcome: null`
  (no register was reached), `charged: false`, `reused: false`, `replayed: false`, and
  nullable request fields (`request_id`, `number`, and `register` as received, or `null`
  if absent or invalid). These entries do not create a check record and are not
  retrievable via `get-check`.

No number, name or reply body appears in any log line visible outside the action.

### 7.5 The builders' page

For builders only (not callers):

- Today's paid and practice check count per caller.
- The recent call log, with each number masked to its last 4 characters.
- Callers' settings. Changes are made only by a builder; every change is kept (who made
  it, when, and what it changed from and to).

### 7.6 Data retention

Version 1 **keeps every check record and every call-log entry forever** (owner's
decision, 2026-11-21, recorded in `docs/STATUS.md`): no deletion is built, no TTL is
set, no archival runs. The retention policy for production is a separate decision
the owner will take before production (`docs/OPEN_ITEMS.md`, item 4).

---

## 8. The practice register

A file of **invented** numbers kept with the code, each with its answer. Any number not
in the file returns `NOT_FOUND`.

The file starts from the CRM's `practice_register.json`, keeping every number and answer
unchanged, so CRM test sites work through this service without change.

The following invented numbers are added for testing every outcome. All begin `ZZZZ`
(a real PAN's 4th letter is never Z).

| Number | Kind | Outcome | Notes |
| --- | --- | --- | --- |
| `ZZZZT9001Z` | PAN | `NO_ANSWER` | Practice register simulates a timeout/unavailability |
| `ZZZZT9002Z` | PAN | `NOT_SET_UP` | Practice register simulates key/config error |
| `ZZZZT9003Z` | PAN | `REFUSED_INPUT` | Practice register simulates a provider-side request refusal |
| `ZZZZT9004Z` | PAN | `FOUND` (slow) | Practice register delays 18 seconds, then returns `FOUND` with `registered_name: "PRACTICE SLOW ANSWER LIMITED"` and `holder_type: null` (4th letter Z). Proves a slow-but-good answer is not cut off. |
| `ZZZZT9005Z` | PAN | `NO_ANSWER` (timed out) | Practice register delays more than 20 seconds; the service's 20 s timeout cuts it off and the outcome is `NO_ANSWER`. Proves the timeout works without paying SurePass. |
| `ZZZZA2050Z` | PAN | `FOUND` (gstins-by-pan only) | Practice register returns an explicitly empty GSTIN list (`[]`) for this PAN |
| `37ZZZZT9001Z1ZC` | GSTIN | `NO_ANSWER` | Practice register simulates a timeout/unavailability |
| `37ZZZZT9002Z1ZB` | GSTIN | `NOT_SET_UP` | Practice register simulates key/config error |
| `37ZZZZT9003Z1ZA` | GSTIN | `REFUSED_INPUT` | Practice register simulates a provider-side request refusal |

**Check characters for the new GSTINs above** (computed with the GST network's
check-character algorithm, as implemented in `accounts/identity_checks.py`):
- `37ZZZZT9001Z1ZC`: state 37, PAN `ZZZZT9001Z`, entity 1, check `C`
- `37ZZZZT9002Z1ZB`: state 37, PAN `ZZZZT9002Z`, entity 1, check `B`
- `37ZZZZT9003Z1ZA`: state 37, PAN `ZZZZT9003Z`, entity 1, check `A`

`ZZZZA2050Z` has only a `gstins-by-pan` entry in the practice register. `check-pan`
for this PAN returns `NOT_FOUND` (no entry for the PAN action). `check-gstin` requires
a 15-character GSTIN, not a PAN — a request passing `ZZZZA2050Z` as a GSTIN is refused
with 400 (malformed GSTIN) before the practice register is consulted.

The cancelled GSTIN (`27AAACP7361R2ZP`) from the CRM's practice register is kept and
serves the "cancelled GSTIN" fixture. The PAN `AAACP7361R` with its three GSTINs (two
active, one cancelled) serves the "PAN with several GSTINs" fixture.

The practice register derives `holder_type` from the PAN's 4th letter (the same mapping
as section 5.2). For the new `ZZZZ` practice PANs, the 4th letter is always `Z`, which
is not in the holder-type mapping, so `holder_type` is `null` for all `ZZZZ` PANs. For
existing CRM practice PANs the 4th letter gives a valid type (e.g. `AAACP7361R` → 4th
letter `C` → `COMPANY`).

---

## 9. The SurePass adapter

Adapter settings (Isomorph console, App setup):

- `SUREPASS_BASE_URL`: live `https://kyc-api.surepass.app/api/v1`,
  test `https://sandbox.surepass.app/api/v1`.
- `SUREPASS_API_TOKEN`: sent as `Authorization: Bearer <key>`. Never logged, returned
  or shown. Never ends in `_SIGNING_SECRET`, `_JWT_SECRET`, `_SESSION_SECRET`,
  `_COOKIE_SECRET` or `_CSRF_SECRET`.

Paths:

| Action | Path |
| --- | --- |
| `check-pan` | `POST /pan/pan` |
| `check-gstin` | `POST /corporate/gstin` |
| `gstins-by-pan` | `POST /corporate/gstin-by-pan` |

Request body: `{ "id_number": "<number>" }` with `Authorization: Bearer <key>` and
`Accept: application/json`.

**Reply → outcome mapping:**

| SurePass replies | Outcome |
| --- | --- |
| 200 with `success: true` and a complete answer (guards apply; see below) | `FOUND` |
| 200 with `success: false`, or 200 without `success: true` | `NO_ANSWER` |
| 404 or 422 with a JSON body having `success: false` | `NOT_FOUND` |
| 404 without such a body (wrong address) | `NOT_SET_UP` |
| 422 without such a body | `NO_ANSWER` |
| 400 | `REFUSED_INPUT` |
| 401, 403 | `NOT_SET_UP` |
| 429, 5xx, timeout (20 seconds), network failure | `NO_ANSWER` |
| Any other HTTP status, or a response body that is not valid JSON | `NO_ANSWER` |

The rows are evaluated in the order shown. Status-code rows take precedence: the
JSON/non-JSON distinction of the catch-all row applies only to statuses not covered by
any earlier row. 3xx responses are not followed; they fall through to the catch-all as
`NO_ANSWER`.

**Guards (from the CRM's tested code):**

- An answer whose own number field (`pan_number` for PAN, `gstin` for GSTIN) does not
  match the number asked is `NO_ANSWER`.
- SurePass's sentinel date `1800-01-01` is read as `null`.
- An incomplete answer is `NO_ANSWER`: a PAN with no `full_name`, a GSTIN with no
  `gstin_status`, a `gstins-by-pan` reply with no `gstin_list` or whose list is not an
  array, or a list that holds a GSTIN whose characters 3–12 are not the PAN asked.
- SurePass's rate limit is 100 calls/minute: the service never retries in a loop.

Timeout is 20 seconds per call. A timeout is `NO_ANSWER`.

**PAN holder type from SurePass.** SurePass's `category` values map to holder types:

| SurePass `category` | Holder type |
| --- | --- |
| `company` | `COMPANY` |
| `person`, `individual` | `PERSON` |
| `huf` | `HUF` |
| `firm` | `FIRM` |
| `aop` | `ASSOCIATION_OF_PERSONS` |
| `aop_trust`, `trust` | `TRUST` |
| `boi` | `BODY_OF_INDIVIDUALS` |
| `local_authority` | `LOCAL_AUTHORITY` |
| `artificial_juridical_person` | `ARTIFICIAL_JURIDICAL_PERSON` |
| `government` | `GOVERNMENT` |

Matching is case-insensitive. If unmapped, fall back to the PAN's 4th letter. If still
unmapped, `holder_type` is `null`.

**GSTIN field mapping from SurePass.** SurePass's field names never cross the contract:

| Contract field | SurePass field |
| --- | --- |
| `legal_name` | `legal_name` |
| `trade_name` | `business_name` (fallback: `trade_name`) |
| `registration_status` | `gstin_status` |
| `registered_address` | `address` |
| `constitution_of_business` | `constitution_of_business` |
| `taxpayer_type` | `taxpayer_type` |
| `registered_on` | `date_of_registration` |
| `cancelled_on` | `date_of_cancellation` |

**GSTINs-by-PAN field mapping from SurePass:**

| Contract field | SurePass field |
| --- | --- |
| `gstin` | `gstin` (characters uppercased) |
| `state_code` | `state_code` |
| `state_name` | `state` |
| `registration_status` | `active_status` (fallback: `status`) |

---

## 10. Changes from the brief's draft (section 4)

Every change is listed here for the owner's approval.

| # | Change | Reason |
| --- | --- | --- |
| 1 | Added explicit rule: input `register` is lowercase; response `register` is uppercase | The draft shows both forms but does not state the rule. Making it explicit prevents any ambiguity in implementation. |
| 2 | Added: `register_time` may be `null` | The draft's example shows a time, but the practice register has no server time and SurePass's HTTP Date header may be absent. The contract must allow null to match reality. |
| 3 | Added: `holder_type` fallback to PAN's 4th letter, then null | The draft says "It is read from SurePass's category, or from the PAN's 4th letter" but does not say what happens when neither maps. The CRM's code returns None; this contract specifies null explicitly. |
| 4 | Added: `gstins-by-pan` with an empty list is FOUND with zero items | The draft says "a reply with no list (no list is not 'none')" is NO_ANSWER but does not address an empty list. The CRM's code treats an empty list as FOUND; this contract makes that explicit. |
| 5 | Added: practice register derives `holder_type` from PAN's 4th letter | The brief's CRM practice_register.json has no `holder_type` field. The contract specifies how the practice register fills it, so the fixture is complete and the CRM's tests see the same value. |
| 6 | Added: `request_id` character-set constraint (alphanumeric, hyphens, underscores) | The draft says "8 to 64 characters" but does not restrict the character set. A character set is needed to prevent injection in log and storage contexts. |
| 7 | Added: `register_reference` may be null | The draft's example shows a value but SurePass may not return one (and practice register never does). Made explicit. |
| 8 | Added: `NOT_FOUND` carries `register_reference` where SurePass sends one | The CRM's surepass.py reads client_id from NOT_FOUND replies for the evidence of rejection. Added to the contract for completeness. |
| 9 | Added: practice numbers for all missing outcomes, with their check characters | The brief says to add these (section 4.7) but does not specify the numbers. They are defined in section 8 of this contract with their computed check characters shown. |
| 10 | Clarified: `get-check` takes either `check_id` or `request_id`, not both; added full request and response shapes for `get-check` and `my-usage` (section 2a) | The brief's section 4.2 says "by `check_id` or `request_id`" but the request shape in section 4.3 does not cover `get-check`, and `my-usage`'s response shape is not defined. Section 2a fills both gaps. |
| 11 | Added: error response body format for action-level refusals (400, 403, 404, 409) in section 6 | The brief specifies status codes for refusals but not the response body. A defined shape is needed for fixtures, tests and callers. |
| 12 | Added: request-slot claim protocol (section 7.2) for concurrent-safety guarantee | The brief states two identical concurrent requests give one paid call and one replay. Without an atomic request-claim step, both requests could reach the provider before either inserts a row. |
| 13 | Clarified: `charged` = paid SurePass call; practice daily counts use a separate invocation count (sections 4 and 7.3) | The brief's actions table says "Charged? When SurePass is called". Practice checks cost nothing but do count against a daily limit. Using `charged` for both would contradict every practice fixture. |
| 14 | Added: `pan`/`gstin` explicitly forbidden in the wrong action (section 3) | Both fields are listed in the contract, so the "unknown field" rule would not catch them. Explicit rejection prevents ambiguous behaviour and cross-action identity of replays. |
| 15 | Added: catch-all for unrecognised SurePass HTTP statuses (section 9) | The table was exhaustive for expected codes but left no rule for 3xx, 402, 405, 408, 409 etc. Any such response is NO_ANSWER. |
| 16 | Softened concurrent-request guarantee in sections 6 and 7.2 to acknowledge the narrow crash window | In a crash scenario (provider call succeeds, result transaction aborts), a paid call may occur without a durable record. The original claim was unconditional; this correction is accurate and does not change the protocol's behaviour outside that window. |
| 17 | Clarified replay logging in section 7.4: replays are recorded in the call log | "Nothing new written" means no new check record and no new charge; the replay itself is still logged. This matches the assessor requirement (brief section 6, check 14) and the section 7.4 table. |
| 18 | Added two-path rule for input-validation refusals (section 7.4): Isomorph's schema check rejects malformed external calls before the action runs (not logged); the action's own validation rejects all callers and logs an action-refusal entry with `outcome: null` (not `REFUSED_INPUT`, which is reserved for register refusals). | Without this distinction, implementers might not log builder-call refusals; without the `outcome: null` rule, action-level rejections would be mis-tagged as register refusals. One combined rule instead of change 18 + change 21 reversing each other. |
| 19 | Added reply-table precedence note and 3xx rule (section 9) | Status-code rows take precedence over the JSON/non-JSON catch-all; 3xx is not followed. |
| 20 | Added IN_PROGRESS placeholder state machine to section 7.2 | The two-transaction protocol left no rule for a concurrent request that arrives while the first is still running. The in-progress state, bounded poll, and stale-claim recovery make the behaviour fully defined. |
| 21 | Folded into change 18 (action-refusal entries carry `outcome: null`, not `REFUSED_INPUT`) | Earlier drafts listed this as a separate correction; it is the same rule as change 18 and is written once there. |
| 22 | Clarified section 5 "never kept": means never eligible for kept-answer reuse, not that the record is not stored; added retrievability rule to section 2a | Non-answer outcomes are recorded and retrievable via get-check; they are simply not candidates for accept_kept_answer_days or the 60-second rule. Added get-check/no-answer.json fixture. |
| 23 | Corrected the stale-claim takeover rule in section 7.2: wait extended from 10 s to 25 s; added claim-token so a late provider reply cannot overwrite a newer claim; added caller-timing note telling callers to show a loading indicator | A SurePass call can take 20 seconds and `ZZZZT9004Z` waits 18 seconds on purpose, so a 10-second wait could declare a live request stale and lead to two paid calls writing the same row. 25 s is longer than SurePass's 20 s timeout plus the result write, so a live request cannot be taken over; the claim token stops a late reply from overwriting a newer claim. Added `check-pan/reused-after-wait.json` fixture. |
| 24 | Corrected the slow practice number: `ZZZZT9004Z` now returns `FOUND` after 18 seconds (with `registered_name: "PRACTICE SLOW ANSWER LIMITED"`, `holder_type: null`), not `NO_ANSWER`. Added `ZZZZT9005Z` which delays past the 20-second timeout and returns `NO_ANSWER`. | Brief 4.7 asks for "a slow answer just inside the time limit" — a slow answer that arrives and is still taken. `ZZZZT9004Z` as `NO_ANSWER` tested nothing useful for the slow case. The pair proves both the slow-kept case and the timeout-cut-off case, without paying SurePass. Fixtures added. |
| 25 | Added `answered_at` to every check response; on a reused answer `register_reference` and `register_time` are the **original** register's values, unchanged; the response's `check_id` on a reused answer is this caller's new id, not the original's. | Under `accept_kept_answer_days` an answer may be up to 366 days old. The old contract gave the caller today's `checked_at`, `register_reference: null`, and `register_time: null` — the CRM would then see the reused answer as "today's" and never re-check it; PBL also could not trace which paid call the answer came from. `answered_at` tells the caller the real age; keeping the original register reference and time preserves the audit trail. A new `check_id` protects per-caller isolation (owner's C5 decision). Every check-response fixture updated. |
| 26 | Section 1 rewritten to cover both caller kinds: service credentials (unchanged) and builders calling from inside the app. A builder's call always uses the practice register — any request for SurePass returns `NOT_SET_UP`, wired into the contract (no setting can change it). Caller log identity is `builder:<email>`. | The brief's lesson 4 (Isomorph: `expose.input` skipped for builder calls) meant a builder could reach every action, with no stated register, limit or settings. As written, a builder's click could cost PBL SurePass money with no daily cap. Routing every builder call to the practice register — regardless of settings — closes this door and makes real-number tests only possible with a service credential (brief section 5, step 6). New fixture `check-pan/not-set-up-builder.json`. |
| 27 | Section 3 (`accept_kept_answer_days`) and section 4 (`check_id`) state explicitly that any caller's `FOUND`/`NOT_FOUND` answer on the same register for the same number may be reused, not only this caller's; per-caller fields (check records, `get-check`, `my-usage`, 60-second double-click) are listed as exceptions. The reused response's `check_id` is always this caller's new id, never another caller's. | The owner decided this on 2026-11-21 (STATUS.md): the registered name of a PAN is the same for everyone; paying SurePass twice for the same answer is waste. The contract did not state the rule — section 3's reuse text said "the same register already gave an answer" without naming whose. Making it explicit removes the ambiguity and, together with the per-caller exceptions, prevents cross-caller `check_id` leakage. |
| 28 | Moved the SQL (§7.3 daily-limit `INSERT … ON CONFLICT DO NOTHING` / `SELECT … FOR UPDATE`) out of the contract into `docs/DESIGN.md` D-05, and added a statement to D-05 of the platform limits the design depends on (Isomorph: 5-minute action, 30-second statement, 5-second lock wait). The contract keeps only the behaviour ("two at the limit — one passes, one gets LIMIT_REACHED"). | The contract says what the caller sees; the design says how we implement it. SQL does not belong in the caller-facing document. Also, the lock cannot be held across a SurePass call (Isomorph gives up a lock wait at 5 seconds, SurePass can take 20); D-05 now states this explicitly so nobody builds it wrong. |
| 29 | Takeover wait extended from 25 s to 30 s and the full honest-path budget (5 s lock + 20 s SurePass + ~2 s result write ≈ 27 s) written into §7.2 and DESIGN.md D-06 as a table (Codex round 4, R4.1). | 25 s was less than the longest honest live path when the daily-count lock-wait (5 s) was included; a live request could be declared stale and lead to two paid calls. 30 s is strictly greater than every step bound and the table forces any future bound change to be reflected here. |
| 30 | Added token-loss recovery in §7.2 and D-06 (Codex round 4, R4.2): when a request's claim token has been replaced by a new claimant and the row is still `IN_PROGRESS`, the original request waits up to 30 s more for the new claimant to finalise, then returns `NO_ANSWER` if still unfinalised. Added fixture `check-pan/no-answer-token-lost.json`. | The original claim-token fix stopped a late write from overwriting a newer claim, but left the original request with no defined path when its own token was gone and the new row was not yet terminal. The second wait + `NO_ANSWER` give the request a defined end; the stale row then becomes a candidate for the next request's takeover. |
| 31 | §7.2 states explicitly that **different `request_id`s from the same caller are different requests** — they claim different slots and do not coalesce (Codex round 4, R4.3). Fixed fixture `check-pan/reused-after-wait.json` so both requests share the same `request_id` (the only case where a wait-and-replay can occur). | The old fixture used two different `request_id`s, so under §7.2's `(caller, request_id)` unique key the requests would never conflict; the demonstrated wait + replay could not actually happen. The 60-second double-click rule and `accept_kept_answer_days` cover the cross-`request_id` cases. |
| 32 | §1 now has one builder rule only (Codex round 4, R4.4): a builder may call the actions with `register: "practice"` only; a builder request naming `"surepass"` is refused with `NOT_SET_UP` before any register call. The earlier contradictory "always uses practice whatever the request says" wording is removed. SCOPE.md mirrors the single rule. | Two rules that disagree in the same paragraph (silent redirect vs. explicit refusal) left an implementer free to pick either. The refuse rule is honest (the builder sees `NOT_SET_UP` and switches to practice deliberately) and matches the existing fixture `check-pan/not-set-up-builder.json`. |
| 33 | §4 pins each timestamp's exact meaning (Codex round 4, R4.5): `checked_at` is set at request accept and never changes; `register_time` is when the register produced the answer, always `null` for the practice register, carried unchanged on reuse/replay; `answered_at` is when the register first gave this answer, equals `checked_at` for a new check or non-answer outcome, the original check's time on reuse. §4's own example now has all three equal for the new-check case. Fixtures aligned: `reused.json` (practice) carries `register_time: null` with the age in `answered_at` only; `no-answer-timeout.json` sets `checked_at` at arrival, not at timeout completion. | Three timestamps with loose meanings let implementers record different moments in the same fields and let the CRM miscalculate a reused answer's age. One precise definition per field, mirrored in the examples, makes misreading impossible. |
| 34 | §7.4 widens the call log's `caller` field to accept `service:<clientId>` **or** `builder:<email>`, allows `outcome: null` for action-refusal entries, allows null for `request_id`/`number`/`register`/`kind`/`check_id` where the field was absent or invalid. SCOPE.md's "Data kept" lists a separate `call_log` table alongside `checks`. DESIGN.md adds D-13 explaining the two-table model (Codex round 4, R4.6). | §7.4 required logging every call (replays, action refusals, builder calls, successful calls) in the same place that §7.2 made unique on `(caller, request_id)` — impossible. A separate `call_log` table carries the audit trail without constraints, and `checks` keeps its idempotency guarantee. Builders' identity now has a place to live in the log. |
| 35 | §7.6 Data retention, SCOPE.md and DESIGN.md "Open questions" updated to reflect the owner's decisions of 2026-11-21 (Codex round 4, R4.7): version 1 keeps every record (no deletion built); the production retention policy is the one remaining open item (`docs/OPEN_ITEMS.md`, item 4). | The three questions the documents still described as open were already closed by the owner. Records must say what's true. |
