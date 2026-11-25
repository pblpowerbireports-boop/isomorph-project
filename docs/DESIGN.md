# Design

Technical decisions for PBL Identity Checks. Each decision records what was chosen,
why, and where the rule comes from (the brief, a CRM lesson, or a platform constraint).

Updated: 2026-11-21, package 01 (contract, scope and design).

---

## Decisions

### D-01 — Provider-neutral contract, SurePass as an adapter

**Decision:** The contract uses only the service's own field names. SurePass's field
names, HTTP paths, response structures and error codes are confined to one adapter module
(`actions/lib/surepass/`). The contract version (`1.0`) travels in every response.

**Reason:** The brief (section 1) requires this explicitly. It ensures callers need no
change if PBL adds or changes the provider.

---

### D-02 — Outcomes, not errors, for failed register calls

**Decision:** Every check returns HTTP 200. A failed register call (timeout, refusal,
key error, limit reached) is an `outcome` field value, not an HTTP error. Only genuine
API misuse (wrong shape, bad auth, duplicate key) produces 4xx.

**Reason:** The contract (section 4, section 6) defines this. It makes callers' retry
logic simple: they always get a JSON body with an `outcome`; they never need to handle
both 2xx and 5xx for the same action.

---

### D-03 — Vitest as the unit test runner

**Decision:** Vitest for unit tests in `unit/*.test.ts`.

**Reason:** The brief (`docs/rules/TESTING.md`) names Vitest as the chosen test runner.
No second test framework is introduced.

---

### D-04 — India day helper for all date/time rules

**Decision:** One helper (`actions/lib/india-day.ts`) gives "today in India"
(Asia/Kolkata midnight–midnight) and converts any UTC moment to its India date. All rules
that depend on the calendar day (daily limits, `accept_kept_answer_days`, the call log)
call this helper. Tests fix today through it.

**Reason:** Coding standards (section 7) require this. Without it, a CI run that crosses
midnight in India can flip a date-sensitive test.

---

### D-05 — Row lock for daily-limit enforcement

**Decision:** Daily limits are enforced with an `INSERT … ON CONFLICT DO NOTHING`
followed by `SELECT … FOR UPDATE` on the `daily_counts` table, inside one **short**
database transaction. In pseudocode:

```
BEGIN
  INSERT INTO daily_counts (caller, register, india_date, count)
  VALUES ($caller, $register, $date_india, 0)
  ON CONFLICT (caller, register, india_date) DO NOTHING;

  SELECT count, daily_limit
  FROM daily_counts
  WHERE caller = $caller AND register = $register AND india_date = $date_india
  FOR UPDATE;

  -- if count >= daily_limit -> return LIMIT_REACHED here (ROLLBACK, no provider call)

  UPDATE daily_counts SET count = count + 1
  WHERE caller = $caller AND register = $register AND india_date = $date_india;
COMMIT
```

The insert ensures the row exists for the first request of the day; the lock ensures
two simultaneous requests at the limit cannot both pass. **The transaction holds the
lock only to read the count, decide, and increment — then it commits and releases.
The SurePass call runs AFTER this transaction has committed, never while the lock is
held.**

**Platform limits this design depends on** (Isomorph; see brief §10 lessons):

- An action may run up to **5 minutes**. The service's total response time (claim +
  limit check + SurePass call + result write) is well under this.
- A single statement may run up to **30 seconds**. SurePass's 20-second timeout is
  inside this bound.
- A lock wait is given up after **5 seconds**. If the count lock were held across a
  20-second SurePass call, the caller's next concurrent call would wait 5 s and fail
  with a lock-wait error rather than return a proper outcome. Hence the "short
  transaction" rule above.

**Reason:** Coding standards (section 4) require database-level enforcement. Without
the insert-on-conflict, `FOR UPDATE` on a non-existent row locks nothing, so two
concurrent first-of-day requests could both see "no row" and both pass. Isomorph
lesson 3 (brief, section 10): `.forUpdate()` inside `ctx.transaction` needs an `UPDATE`
row-level policy on the table. Holding the lock across the SurePass call would hit
Isomorph's 5-second lock-wait and 30-second statement limits.

---

### D-06 — `request_id` uniqueness enforced by unique constraint + request-claim state machine

**Decision.** A unique constraint on `(caller, request_id)` in the `checks` table
prevents two final rows. Before calling the provider, the service inserts a
placeholder row with internal state `IN_PROGRESS` and a **claim token** (fresh UUID),
committed immediately. If that insert conflicts:
- with a finalised row → `replayed: true` (same request) or 409 (different request);
- with an `IN_PROGRESS` row → poll up to **45 s** for finalisation, then replay; if
  still in-progress after 45 s (stale claim), take the claim with an **atomic CAS**:
  `UPDATE row SET claim_token = <my new token> WHERE state = 'IN_PROGRESS' AND
  claim_token = <the stale token I observed>`. Exactly one concurrent waiter's CAS
  succeeds; the losing waiters go back to polling and ultimately replay the row the
  winner finalises. **No two waiters can both proceed to a provider call.**

After the provider call (or any terminal path with no call), the result transaction
is a **short write with a 5-second budget** that finalises the row via an atomic CAS
against the request's own token: `UPDATE row SET state = 'TERMINAL', outcome = …
WHERE claim_token = <my token>`. If the write exceeds its budget, the request treats
the row as failed, leaves it IN_PROGRESS for the next request's takeover, and
returns `NO_ANSWER`.

If the CAS fails because the token has changed (the claim was taken over as stale),
the original request waits up to 45 s more for the new claimant to finalise the row,
then replays that answer. If still IN_PROGRESS after the second wait, the original
request atomically finalises the row itself as `NO_ANSWER` (CAS against the stuck
successor's token). If that CAS succeeds the row is now terminal and the returned
`check_id` is durable; if it loses (the successor finalised one instant before), the
original reads the terminal row and returns that answer as a replay. Either way the
returned `check_id` points at a durable terminal row.

`get-check` never returns an `IN_PROGRESS` row.

**The 45-second bound, justified.** The wait before takeover is 45 s because every
honest path by which a live request may be running fits strictly inside it, with each
step hard-bounded:

- up to 5 s waiting on the daily-count lock (Isomorph's lock-wait maximum, D-05);
- up to 20 s inside the SurePass provider call (§9's timeout);
- up to **5 s** to commit the result transaction (new rule: a short write; if the
  statement exceeds this budget, the request returns `NO_ANSWER` rather than block).

Honest-path upper bound: **30 s**. Takeover wait: **45 s** (strictly greater, with
15 s margin for clock drift and measurement jitter). Any future change to one of the
step bounds (longer SurePass timeout, slower lock) must be reflected in this wait, or
two paid calls become possible again. The margin is deliberately kept small so that
pathological cases hit NO_ANSWER rather than two paid calls.

**Reason.** The unique constraint alone prevents the second *insert* but not the
second *provider call*, and a two-transaction protocol without an in-progress state
leaves no defined behaviour when the second request arrives while the first is still
running. An atomic CAS on the stale token stops concurrent waiters from each becoming
"the" successor and each calling the provider. The result-write CAS stops a late
terminal write from overwriting a newer claim's answer. The second wait + atomic
NO_ANSWER finalise gives the original request a defined end that returns a durable
`check_id`, even if the new claimant also fails.

Coding standards (section 4): "a unique constraint for 'one record per request id'";
contract section 7.2 defines the full state machine.

---

### D-07 — Practice register derived `holder_type` from PAN's 4th letter

**Decision:** The practice register has no `holder_type` field in its JSON. The service
derives `holder_type` from the PAN's 4th letter (the Income Tax standard mapping from
contract section 5.2). `ZZZZ` PANs (4th letter `Z`, not in the mapping) get
`holder_type: null`.

**Reason:** The CRM's `practice_register.json` omits holder_type. Without a derivation
rule the fixture is incomplete and callers (including the CRM) would get different values
from practice and SurePass for the same number. Recorded in contract section 8.

---

### D-08 — Empty GSTIN list is `FOUND` with zero items

**Decision:** When `gstins-by-pan` gets a valid response from the register with an empty
list (`[]`), the outcome is `FOUND` with `answer.gstins = []`. A missing or non-array
`gstin_list` is `NO_ANSWER`.

**Reason:** The CRM's code (`providers/surepass.py`) treats an empty list as FOUND.
An empty list is a real answer ("this PAN has no GSTINs on record"). A missing list
means the register did not answer properly. Recorded in contract section 5.4 and
fixtures (`gstins-by-pan/found-empty.json`).

---

### D-09 — `get-check` and `my-usage` response shapes (section 2a)

**Decision:** `get-check` returns the check record in the same shape as a check action
(section 4). `my-usage` returns `contract_version`, `caller`, `date`, and per-register
objects with `invocations_today` (count of new register invocations, excluding replays,
reuses and LIMIT_REACHED outcomes) and `daily_limit`.

**Reason:** The brief defines these actions by what they do, not by their response shape.
Section 2a was added to the contract to make the shapes explicit and testable. Without a
defined shape, the fixtures and tests cannot verify the contract.

---

### D-10 — Error response body `{ "error": "<code>", "message": "..." }`

**Decision:** Every action-level refusal (400, 403, 404, 409) returns JSON with two
fields: `error` (a code) and `message` (plain English, no internal detail). 401 is
Isomorph's own and may differ. Error messages never echo the submitted number, name,
key or provider reply.

**Reason:** Callers need a stable shape to parse errors. Codes and messages are defined
in contract section 6. This aligns with PBL's MCF-001 error conventions.

---

### D-11 — `charged` = paid SurePass invocation only

**Decision:** `charged: true` only when a paid SurePass call was made. Practice
register checks are always `charged: false`. Daily-limit counts for practice use a
separate invocation count (`invocations_today` in `my-usage`), not the `charged` flag.

**Reason:** The brief's actions table says "Charged? When SurePass is called." Using
`charged: true` for practice checks too would contradict every practice fixture (the
practice register costs nothing). Separating "charged" (paid SurePass call) from
"invocations_today" (new calls that count against any register's daily limit) makes
both concepts unambiguous.

---

### D-12 — SurePass catch-all: unrecognised HTTP status → NO_ANSWER

**Decision:** Any HTTP status not explicitly in the reply-to-outcome table (section 9),
or any response body that is not valid JSON, maps to `NO_ANSWER`.

**Reason:** SurePass could return 3xx, 402, 405, 408, 409 etc. Without a catch-all, the
adapter has no contractual outcome and might throw or return an HTTP error, breaking
the contract's guarantee that every register failure becomes a 200 check outcome.

---

### D-13 — `call_log` is a separate table from `checks`

**Decision.** The data model has two tables:

- `checks`: one row per **completed** check record. Unique on `(caller, request_id)`
  (via D-06). Holds `IN_PROGRESS` placeholders too (same uniqueness). Carries the
  answer, the register evidence, the claim token, and the state.
- `call_log`: one row per **invocation attempt**. **No** unique constraint on
  `(caller, request_id)`. Holds replays (multiple rows per `request_id`), action
  refusals (`outcome: null`), builder calls, and successful calls side by side.
  `caller` is `service:<clientId>` or `builder:<email>`. Field list in contract §7.4.

**`check_id` on action-refusal entries.** Ordinary action refusals (malformed input,
wrong type, missing or unknown field) have **`call_log.check_id = null`** — no
`checks` row exists for them. The one exception is a **409 same-id/different-request
refusal**: the mismatch was found by looking up the existing finalised check whose
`request_id` was reused, so `call_log.check_id` **points to that existing check row**.
This is the only path where an action-refusal entry has a non-null `check_id`.
Contract §7.4's `check_id` row and 409 paragraph state the same rule.

Every call that reaches an action writes one `call_log` row. A call that updates or
replays a `checks` row also sets `call_log.check_id` to the corresponding row's id;
an action-refusal row leaves `check_id` null.

**Reason.** Contract §7.4 requires logging **every** call — including replays and
action-level refusals — but `checks` holds only completed check records and its
`(caller, request_id)` unique constraint (D-06) rules out a second row for the same
request. Attempting to carry both roles in one table forces either a partial unique
index (hard to read, easy to get wrong) or an extra `kind_of_entry` discriminator
column. Two tables, each with one job, is the clearer model: `checks` protects
idempotency; `call_log` carries the audit trail.

Isomorph row-level security on both tables is as the isomorph skill requires. The
page masks numbers from `call_log` the same way it masks numbers from `checks`.

---

## Open questions

See `docs/OPEN_ITEMS.md`. All three package-01 open questions were closed by the
owner on 2026-11-21 (recorded in `docs/STATUS.md`): data retention for version 1
(keep everything, no deletion), `holder_type` null when nothing maps (accepted), and
`gstins-by-pan` empty list → `FOUND` (accepted). The only item still open is the
production retention policy (`docs/OPEN_ITEMS.md`, item 4), to be decided by the
owner before production.
