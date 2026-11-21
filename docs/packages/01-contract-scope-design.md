# Package 01: contract, scope and design

Branch `pkg/01-contract-scope-design`, from `main` at `5e4566c`. Status: building.

## 1. Plan

**What this package does:**
Produces the three documents that the owner must approve before any code is written: the
service contract (`docs/contracts/identity-checks-contract.md` v1.0 with its fixtures), the
scope (`docs/SCOPE.md`) and the design (`docs/DESIGN.md`). Every open question is listed.
No application code is written or changed.

**Not in this package:**
Any action, migration, test, job or page. The SurePass adapter is described in the contract
(section 8) for the owner's understanding, but its code is package 03.

**Reading list:**

- Brief: all sections (0–10), read in full before writing the contract
- `docs/rules/WORKING_METHOD.md`: sections 1–6 (all)
- `docs/rules/CODING_STANDARDS.md`: sections 1–9 (all)
- `docs/rules/TESTING.md`: sections 1–8 (all)
- `docs/rules/REVIEW_METHOD.md`: sections 1–7 (all)
- `docs/STATUS.md`, `docs/OPEN_ITEMS.md`
- CRM reference: `providers/base.py`, `contract.py`, `accounts/identity_checks.py`,
  `providers/surepass.py`, `providers/practice_register.json` — the normalized answers
  and tested SurePass mapping this contract mirrors
- `docs/packages/_TEMPLATE.md`

**Files to change:**

- `docs/packages/01-contract-scope-design.md` (this file)
- `docs/contracts/identity-checks-contract.md` (new)
- `docs/contracts/fixtures/` (new, one subdirectory per action plus one for refusals)
- `docs/SCOPE.md` (new)
- `docs/DESIGN.md` (new)
- `docs/STATUS.md` (updated)
- `docs/OPEN_ITEMS.md` (updated)

**Rules and their tests:**

| Rule | Test |
| --- | --- |
| Each fixture is valid JSON | `node -e "JSON.parse(require('fs').readFileSync(process.argv[1]))"` on each fixture file, run as part of full checks |
| `isomorph check` passes on the kit app (no code changes in this package, so this is a baseline) | `isomorph check --app-root . --json` |

**Risks:**

- The draft contract (brief section 4) is detailed but leaves some gaps (holder_type for
  the practice register; register_time nullability; empty-list behaviour for
  gstins-by-pan). These are resolved in the contract with the reason listed.
- The practice register JSON does not include `holder_type` for PAN entries. The contract
  specifies it is derived from the PAN's 4th letter; the fixtures show this.
- The brief defers the data-retention policy. This is an open question.

**Questions for the owner:**

1. **Data retention.** The brief says "how long answers are kept is a PBL policy not yet
   decided". What is the policy? Until this is decided, no deletion is built. (Listed in
   OPEN_ITEMS.)
2. **`holder_type` null case.** When SurePass returns a category not in the mapping table
   and the PAN's 4th letter is also not a known holder-type letter, the contract specifies
   `holder_type: null` in the answer. Is this acceptable? (The CRM's code has the same
   gap: `PAN_HOLDER_TYPES.get(pan[3:4])` returns `None` for unknown letters.)
3. **Empty GSTIN list.** When SurePass returns `gstins-by-pan` with `success: true` and
   an empty `gstin_list` array (`[]`), the contract specifies `FOUND` with an empty
   `gstins` list. Is this the right behaviour, or should it be `NOT_FOUND`? (The CRM's
   code returns `FOUND` with 0 GSTINs.)

## 2. What was built

`docs/contracts/identity-checks-contract.md` — the contract at version 1.0, refined from
the brief's section 4 draft. Every change from the draft is listed in section 2 of the
contract and in the closing notes to the owner at the end of this package.

`docs/contracts/fixtures/` — one JSON file per outcome per action type, plus refusals.
Each file holds a `request` object and a `response` object (or just `response` for
refusals and for `my-usage`).

`docs/SCOPE.md` — what the service does, its roles, and what is not in scope.

`docs/DESIGN.md` — the technical decisions behind the contract and the chosen design.

`docs/STATUS.md`, `docs/OPEN_ITEMS.md` — updated.

**Technical decisions** (each also under Decisions in `docs/DESIGN.md`):

| Decision | Why |
| --- | --- |
| Input `register` is lowercase; response `register` is uppercase | The input follows REST convention (lowercase enum values); the response is a normalised code that matches the internal constant. Explicit because the brief shows both but does not state the rule. |
| `register_time` may be null | The practice register has no server time; SurePass's HTTP Date header may be absent. A missing time is not an error. |
| `holder_type` falls back to PAN's 4th letter, then null | Mirrors the CRM's tested code exactly. SurePass's `category` is the primary source; the 4th letter is the fallback when the category is absent or unmapped; null when neither maps. |
| `gstins-by-pan` with an empty list is `FOUND` with zero items | An empty list is a valid GST-network answer ("this PAN has no GSTINs"). No list at all (`gstin_list` missing or not an array) is `NO_ANSWER`. Mirrors the CRM's code. |
| Practice register `holder_type` derived from PAN's 4th letter | The CRM's practice_register.json has no `holder_type` field. The service derives it the same way SurePass does (4th letter), so the CRM's tests see the same value through this service as they do through the CRM's direct call. |
| Practice numbers for missing outcomes begin `ZZZZ` | The brief's rule (section 4.7): a real PAN's 4th letter is never Z, so none of these can be a real company's. |
| `accept_kept_answer_days` upper bound is 366 (not 365) | To cover leap-year "one year" use. The brief states this; it is included here as a decision to make the reason explicit. |

## 3. Tests and checks

| When | Commit | Command | Exact result |
| --- | --- | --- | --- |
| Before round 1 | `6d0d4ca` | `node -e "..."` (JSON.parse all fixtures) | 30 passed, 0 failed (pre-R0 fixes) |
| Before round 1 | `6d0d4ca` | `isomorph check --app-root . --json` | SUCCEEDED: 19 pass, 1 skip (container.authenticated-write-failed — kit journeys not updated), 0 fail |

**Undo proofs:** not applicable — this package writes documents only; no code is added
or changed.

**Not run, and why:**
- `npm run build`, `npm test`: no code changed in this package.
- Click-through: no screen changed (kit screen is unchanged).

## 4. Reviews

| Round | Commit reviewed | Packet SHA-256 (first 12) | State | Blocking / material / advisory | Owner's permission (rounds after 3) |
| --- | --- | --- | --- | --- | --- |
| 0 (self-review) | `6d0d4ca` | n/a | CORRECTION_REQUIRED | 1 material, 2 advisory | n/a |
| 1 | `0330a68` | `a38e6cb7d581` | CORRECTION_REQUIRED | 0 blocking, 8 material, 1 advisory | n/a |

**Findings and decisions:**

| # | Severity | What was found (one line) | Builder's decision | Why | Fixing commit | Test that now catches it |
| --- | --- | --- | --- | --- | --- | --- |
| R0.1 | Material | Contradictory prose in section 2a: "`replayed` is always false … (the original value from when the check was recorded)" | **Fix** — builder said "fix all three" | Clarified to: return the stored value; not reset to false by the lookup | see next commit | fixture `get-check/found.json` shows stored replayed value |
| R0.2 | Advisory | No `replayed: true` or `reused: true` fixture; both are contract-visible fields tested by the assessor | **Fix** — builder said "fix all three" | Added `check-pan/replayed.json` and `check-pan/reused.json` | see next commit | n/a (documentary) |
| R0.3 | Advisory | `ZZZZA2050Z` has only a gstins-by-pan practice entry; check-pan/check-gstin behaviour for it was unstated | **Fix** — builder said "fix all three" | Added clarifying note to contract section 8 | see next commit | n/a (documentary) |
| R1.1 | Material | Concurrent identical requests: unique constraint catches second insert but not second provider call | **Fix** — builder said "fix all nine" | Added request-slot claim protocol to contract §7.0 and DESIGN.md D-06 | see next commit | n/a (documentary) |
| R1.2 | Material | FOR UPDATE on non-existent daily_counts row locks nothing (first request of day) | **Fix** — builder said "fix all nine" | Added insert-on-conflict before FOR UPDATE to contract §7.2 and DESIGN.md D-05 | see next commit | n/a (documentary) |
| R1.3 | Material | `charged` semantics conflict: "counted against daily limit" vs. practice fixtures all charged: false | **Fix** — builder said "fix all nine" | `charged` = paid SurePass call only; `invocations_today` in my-usage counts new calls to any register | see next commit | n/a (documentary) |
| R1.4 | Material | 400-wrong-gstin-check-char message echoes submitted number | **Fix** — builder said "fix all nine" | Changed message to "GSTIN check character is wrong." | see next commit | fixture R1.4 |
| R1.5 | Material | `checked_at` mismatch: get-check/found uses `10:15:00Z` but check-pan/found uses `10:15:01Z` for same check_id | **Fix** — builder said "fix all nine" | Aligned get-check/found.json to `10:15:01Z` | see next commit | fixture R1.5 |
| R1.6 | Material | SurePass reply table has no catch-all for unrecognised HTTP statuses | **Fix** — builder said "fix all nine" | Added catch-all row: any other status or non-JSON body → NO_ANSWER | see next commit | n/a (documentary) |
| R1.7 | Material | `pan` and `gstin` not explicitly forbidden in the wrong action | **Fix** — builder said "fix all nine" | Added explicit prohibition to contract §3 | see next commit | n/a (documentary) |
| R1.8 | Material | R0.3 note wrong for check-gstin (ZZZZA2050Z as GSTIN → 400, not NOT_FOUND) | **Fix** — builder said "fix all nine" | Corrected note in contract §8 | see next commit | n/a (documentary) |
| R1.9 | Advisory | STATUS.md still said checks/self-review pending after R0 and R1 | **Fix** — builder said "fix all nine" | Updated STATUS.md to reflect current state | see next commit | n/a |

## 5. Builder's own checks

*Written by the builder, in their own words. Claude never writes this section.*

## 6. Close

- Final commit:
- Full checks on it (commands and exact counts):
- `docs/STATUS.md` and `docs/OPEN_ITEMS.md` updated:
- The owner's check (date, outcome, findings):
- Merged (date, commit, and the owner's words permitting it):
