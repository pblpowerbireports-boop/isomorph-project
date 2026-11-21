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

**Decision:** Daily limits are enforced with a `FOR UPDATE` row lock inside a database
transaction on the `daily_counts` table. Two simultaneous requests at the limit: one
acquires the lock and passes; the other waits, then finds the limit reached.

**Reason:** Coding standards (section 4) require database-level enforcement of "rules
about many rows". Without the row lock, two simultaneous requests at the limit could both
pass. Isomorph lesson 3 (brief, section 10): `.forUpdate()` inside `ctx.transaction`
needs an `UPDATE` row-level policy on the table.

---

### D-06 — `request_id` uniqueness enforced by unique constraint

**Decision:** A unique constraint on (caller, request_id) in the `checks` table prevents
two rows with the same caller + request_id. The service uses this to detect replays and
conflicts (409) before writing.

**Reason:** Coding standards (section 4): "a unique constraint for 'one record per
request id'". Two identical requests at the same moment must give one paid call and one
replay — this requires a constraint, not only application logic.

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
objects with `checked_today` and `daily_limit`.

**Reason:** The brief defines these actions by what they do, not by their response shape.
Section 2a was added to the contract to make the shapes explicit and testable. Without a
defined shape, the fixtures and tests cannot verify the contract.

---

### D-10 — Error response body `{ "error": "<code>", "message": "..." }`

**Decision:** Every action-level refusal (400, 403, 404, 409) returns JSON with two
fields: `error` (a code) and `message` (plain English, no internal detail). 401 is
Isomorph's own and may differ.

**Reason:** Callers need a stable shape to parse errors. Codes and messages are defined
in contract section 6. This aligns with PBL's MCF-001 error conventions.

---

## Open questions

See `docs/OPEN_ITEMS.md`. The following questions are outstanding as of package 01:

1. Data retention policy (how long check records are kept) — PBL business decision.
2. `holder_type` for a PAN whose SurePass category is absent or unmapped and whose 4th
   letter is also not in the mapping: the service returns `null`; is this acceptable?
   (Recorded in contract section 5.2; likely yes, but not confirmed by the owner.)
3. `gstins-by-pan` returning an empty list: is FOUND the right outcome, or should it be
   NOT_FOUND? (Contract section 5.4 chooses FOUND, matching the CRM; pending confirmation.)
