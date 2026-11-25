# Scope

PBL Identity Checks: a small Isomorph app that checks Indian PAN and GSTIN numbers
and answers PBL's internal systems through a fixed, provider-neutral contract.

Updated: 2026-11-24, package 01 owner-audit corrections.

---

## Roles

| Role | Who | Can do |
| --- | --- | --- |
| `service-caller` | An external system (e.g. the CRM server) with a service credential | Call the five actions: `check-pan`, `check-gstin`, `gstins-by-pan`, `get-check`, `my-usage` |
| `builder` (Isomorph built-in) | A named person with Isomorph builder access | Use the app in development; view the builders' page; change callers' settings. When a builder calls an action from inside the app, **they may use `register: "practice"` only**. A builder request naming `"surepass"` is refused before any register call with outcome `NOT_SET_UP` — a builder's click can never spend SurePass money (see contract §1). |

There is no end-user sign-in. Any signed-in person who is not a builder is refused (403)
when they reach an action.

---

## Actions

Five actions, all `POST /_harbour/api/<action>`:

| Action | Caller | Description |
| --- | --- | --- |
| `check-pan` | `service-caller` | Check one PAN: returns registered name and holder type |
| `check-gstin` | `service-caller` | Check one GSTIN: returns its GST registration |
| `gstins-by-pan` | `service-caller` | List every GSTIN registered under one PAN |
| `get-check` | `service-caller` | Retrieve one earlier check by `check_id` or `request_id` |
| `my-usage` | `service-caller` | Return today's check counts and limits for this caller |

Authentication: OAuth 2.0 client credentials. Tokens expire after one hour. Isomorph
handles 401 and 403; each action checks who may call it again itself.

The contract (`docs/contracts/identity-checks-contract.md`) defines every field, outcome
and error. No field not in the contract crosses the action's response.

---

## Data kept

| Table | Holds | Notes |
| --- | --- | --- |
| `checks` | One row per check: caller, action, request_id, kind, number, register, outcome, charged, reused, replayed, check_id, register_reference, time_taken_ms, checked_at | The call log and the answer store. Numbers stored; masked to last 4 characters in the page |
| `check_answers` | The normalized answer (PAN, GSTIN or GSTINs list) for FOUND and NOT_FOUND checks | Linked to `checks`. Never stores the raw provider reply |
| `caller_settings` | One row per credential: name, registers_allowed, daily_limit_surepass, daily_limit_practice | Changed only by a builder; every change kept in `caller_settings_history` |
| `caller_settings_history` | Append-only log of every change to `caller_settings` | Who changed it, when, from what to what |
| `daily_counts` | One row per (caller, register, India date): count of new invocations (calls that reached the register, excluding replays/reuses/LIMIT_REACHED) | Used for daily-limit enforcement; inserted on-conflict then locked FOR UPDATE |

Data retention is an open question (see `docs/OPEN_ITEMS.md`, item 1).

---

## Screens

One screen, for builders only:

**Builders' page** — today's paid and practice check count per caller; the recent call log
with each number masked to its last 4 characters; callers' settings with a form to edit
them.

No screen is accessible to service callers. The contract is the only interface they use.

---

## Out of scope (version 1)

- Driving licences, vehicle registrations, company details by CIN, PAN comprehensive,
  bank accounts, webhooks.
- Any end-user screen (not a builder screen, no sign-up).
- Deletion of old answers or call log entries.
- Any change to the CRM. The CRM's adapter to this service is a separate CRM package.
- Real-number testing outside a deliberate preview run on the owner's approval.
