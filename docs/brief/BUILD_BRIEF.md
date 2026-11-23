# PBL Identity Checks: build brief for the PBL team

Version 2, 20 November 2026. From the CRM + Hiring project owner.

This brief is for the PBL team and for the AI coding assistants they use (Claude Code builds, Codex reviews). It is
kept, with PBL's working rules, in the private repository `pbl-transport/pbl-dev-standards`. To start, open Claude Code
in a new, empty folder and paste the prompt in section 0: it sets the folder up from that repository, with this brief
as `docs/brief/BUILD_BRIEF.md`.

---

## 0. The prompt to start with (paste it into Claude Code in a new, empty folder)

```text
You are building "PBL Identity Checks": a small service on PBL's Isomorph tenant that checks Indian PAN and GSTIN
numbers with SurePass and answers other PBL systems through a fixed, provider-neutral contract. You work with me, a
PBL developer learning PBL's working method. The project owner approves the work and audits it.

First, set up this folder:

1. Run `isomorph init --app-root .` here, as the isomorph skill says. If the isomorph CLI is not yet connected to
   PBL's tenant (platform.isomorph.ai/t/pbl), stop and ask me for the setup prompt from PBL's Isomorph console.
   Then run `git init -b main`.
2. Clone github.com/pbl-transport/pbl-dev-standards into a folder beside this one. Read it; never change it.
3. Copy everything in its starter/ folder into this folder, keeping the paths. Append starter/CLAUDE.append.md to
   the end of CLAUDE.md and starter/AGENTS.append.md to the end of AGENTS.md, below Isomorph's block, which stays as
   it is; do not copy the two .append.md files themselves. Copy projects/identity-checks/BUILD_BRIEF.md to
   docs/brief/BUILD_BRIEF.md, unchanged.
4. Add .review/ to .gitignore, and confirm that .isomorph/local/ is ignored.
5. Commit on main: "Start from PBL's brief and working rules (pbl-dev-standards <its commit>)".

Then read CLAUDE.md and every file it names, in full. They are the authority: the brief says what to build, the
rules in docs/rules/ say how, and where the rules differ from the isomorph skill, the rules win.

Your first task is package 01 only (the brief, section 5): the contract, its fixtures, docs/SCOPE.md and
docs/DESIGN.md, starting from the draft contract in section 4. Write no application code. Follow
docs/rules/WORKING_METHOD.md step by step: branch pkg/01-contract-scope-design, the package record from
docs/packages/_TEMPLATE.md, your self-review, then the Codex review rounds in docs/rules/REVIEW_METHOD.md. Put every
finding to me with your recommendation, and record my decision. When the rounds are done, list every open question
and every place where you changed the brief's draft contract, with the reason for each, remind me to write my own
section of the record, and stop for the owner's approval.

Never put a real PAN or GSTIN, the SurePass key or any other secret in a file, a commit, a test, a review packet or a
message. Never call SurePass from a test, a journey, CI or `isomorph check`.
```

---

## 1. What we are building, and why

**The service.** One small Isomorph app, "PBL Identity Checks", on PBL's own Isomorph tenant. Other PBL systems call it
to check a number:

- a **PAN**: the name the Income Tax Department holds for it, and who holds it (company, person, firm and so on);
- a **GSTIN**: its registration as the GST network holds it (legal name, trade name, status, address and dates);
- **all GSTINs under a PAN**: every GST registration of one company, by state.

It answers in one fixed form, whoever the register behind it is. Today that register is SurePass. A practice register
of invented numbers serves tests and test sites at no cost.

**Who calls it.** First, the CRM + Hiring server. Later, other PBL apps (Hiring's crew and machine checks, the email
app). Each calling system gets its **own service credential**, allowed only the actions it needs, with its own daily
limit of paid checks.

**Why it is built this way.**

- It is PBL's first real service on Isomorph. It tests both directions at once: outside systems calling in, and the
  service calling out to SurePass. Both were tested separately in November 2026 and passed.
- One place holds the SurePass key, the daily limits and the record of every paid check. Today the CRM calls SurePass
  itself; later other systems need the same checks, and they should not each hold the key.
- PBL's architecture records ("ADR-022") already make identity checking a shared capability. That capability owns the
  provider adapters, the normalized answers, the retries and the evidence references; each system that calls it owns
  what it does with the answer.

**Name it for what it does, not for SurePass.** The repository is `pbl-identity-checks` and the app is "PBL Identity
Checks". SurePass is the adapter inside it. If PBL adds or changes provider later, nothing is renamed and no caller
changes.

**The service knows nothing about the CRM.** No CRM module names, table names, record ids or screens appear in its
code or its contract. A caller sends a number and its own request id, and gets an answer. In a few years the CRM may be
a different product; this service must not need to change when that happens.

---

## 2. Ground rules (not negotiable)

1. **Contract first.** No application code until the contract, `docs/SCOPE.md` and `docs/DESIGN.md` are approved by
   the owner (section 5, package 01).
2. **No real numbers in the repository, ever.** Tests, journeys, fixtures, examples, logs, commits, issues and chat use
   invented numbers only (the practice register, section 4.7). Real numbers are typed only in a deliberate test run on
   the preview, and only from the owner's list.
3. **SurePass is never called by tests, journeys, CI or `isomorph check`.** Every SurePass call costs PBL money. Only a
   deliberate run calls it, and every call counts against a daily limit.
4. **The SurePass key lives only in Isomorph's console** ("App setup"), typed there by the person who holds it. It is
   never put in code, in `.isomorph/local/`, in `.env.example` (which lists only its name), in chat, in a ticket or in an
   email. It is never logged, never returned and never shown.
5. **Least personal data.** For a PAN, use SurePass's "PAN Lite" (`/pan/pan`), which gives the name and the holder
   category only. **Never** use "PAN comprehensive" (`/pan/pan-comprehensive`), which returns mostly personal data.
   Keep SurePass's normalized answer and its reference, not its raw reply. Logs carry no number, no name and no reply
   body: only which check, the outcome and how long it took.
6. **No production release without the owner's word.** Everything is built and assessed on the private preview first.
7. **Nothing in the repository depends on the CRM repository.** Read the CRM's code and documents as background
   (section 10). Port the rules into this service; do not copy the CRM's files in.

---

## 3. The repository

- **A private GitHub repository, `pbl-identity-checks`, in PBL's GitHub organization `pbl-transport`, made by
  Isomorph, not by hand.** It belongs to PBL, not to any one person's account, so it outlasts any of us. The owner
  connects the PBL tenant's Source control to `pbl-transport` before the first deploy. Isomorph keeps each app's
  source, saves it to a private repository of its own making at deploys, and gives a builder access with
  `isomorph github <their GitHub username>` or the deploy's connect link. Its GitHub App can reach only the repositories
  it creates, so a repository made by hand would not be used. Name the app so that its repository is
  `pbl-identity-checks`, if Isomorph lets you choose (section 8, question 3). Until the repository exists, work and
  commit in the folder `isomorph init` makes, in Git.
- **The brief and the working rules come from `pbl-transport/pbl-dev-standards`,** a private repository the owner
  keeps and the PBL team can read. Its `starter/` folder is copied into the app in the first commit (section 0) and
  then belongs to the app; a later change to the rules reaches the app only by a commit that copies it in, on the
  owner's approval.
- **Why a repository of its own.** It is kept apart from `pbl-crm-hiring` because it is a different stack (an Isomorph
  app in TypeScript, not FastAPI and Docker), has a different place it is deployed to, a different team and its own
  release cycle. It also keeps the boundary honest: the CRM reaches it only through the contract.
- **Access.** The project owner: admin (the organization's owner). The PBL team: access to this repository only, in
  Isomorph's way (above). PBL's assessor (the owner's own Claude Code and Codex): read. Nobody who builds the service is
  an admin of it.
- **`main` holds only work the owner approved.** Each package is built on its own branch and reaches `main` only on the
  owner's word (`docs/rules/WORKING_METHOD.md`). On the organization's free plan GitHub cannot enforce this on a
  private repository, so for now it is the team's rule rather than GitHub's; PBL's assessment is of a named commit, so
  it does not depend on it. If CI is added, keep it small: typecheck, unit tests and build. `isomorph check` and
  deploys run from a developer's machine.
- **Layout.** The Isomorph kit app that `isomorph init` makes, plus:

  ```text
  docs/brief/BUILD_BRIEF.md                   this brief, unchanged
  docs/rules/                                 PBL's working rules: method, coding standards, testing, reviews
  docs/contracts/identity-checks-contract.md  the contract (section 4)
  docs/contracts/fixtures/                    one example request and answer per outcome and refusal
  docs/SCOPE.md, docs/DESIGN.md               as Isomorph requires
  docs/STATUS.md, docs/OPEN_ITEMS.md          where the work stands, the owner's decisions, what is left open
  docs/packages/                              one record per package
  docs/reviews/                               every Codex review round's reply, unedited
  docs/HANDOVER.md                            what was built, run and found (section 7)
  scripts/review/                             builds a review packet and checks Codex's reply
  unit/                                       unit tests (Vitest)
  AGENTS.md, CLAUDE.md                        Isomorph's block, then PBL's rules block
  .claude/settings.json                       keeps Claude Code away from the app's secrets and sign-in files
  ```

- **Before the first commit,** confirm that `.isomorph/local/` (secrets, hook addresses, sign-in) and `.review/`
  (review packets) are ignored by Git.

---

## 4. The contract: a draft to refine

Version `1.0`. Package 01 turns this draft into `docs/contracts/identity-checks-contract.md`. Any change to the draft is
listed with its reason for the owner to approve.

### 4.1 How a caller reaches it

- A caller gets a token from Isomorph with its service credential (OAuth client credentials; the token lasts one hour)
  and calls `POST <app's API address>/_harbour/api/<action>` with `Authorization: Bearer <token>`.
- Each credential is allowed named actions only. Isomorph refuses any other action with 403.
- Isomorph checks the request's shape against the action's JSON Schema before the action runs (400). The action checks
  it again itself, because Isomorph does not check it when a builder calls from inside the app (section 6).
- Inside the action, the caller is `service:<clientId>`. That identity is what the service's settings, limits and call
  log use.

### 4.2 Actions

| Action | Does | Charged? |
| --- | --- | --- |
| `check-pan` | One PAN: its registered name and holder type | When SurePass is called |
| `check-gstin` | One GSTIN: its registration | When SurePass is called |
| `gstins-by-pan` | Every GSTIN registered under one PAN | When SurePass is called |
| `get-check` | One earlier check of this caller, by `check_id` or `request_id` | Never |
| `my-usage` | This caller's paid and practice checks today, and its limits | Never |

### 4.3 What a check takes

```json
{
  "request_id": "caller's own key for this request, 8 to 64 characters",
  "pan": "AAACP7361R",
  "register": "surepass",
  "accept_kept_answer_days": 0
}
```

- `pan` for `check-pan` and `gstins-by-pan`, `gstin` for `check-gstin`. Upper case, no spaces. A PAN is 5 letters, 4
  digits and a letter. A GSTIN is 15 characters, its 3rd to 12th characters a PAN, and its last character a check
  character that must fit. The CRM computes the check character in `backend/app/modules/accounts/identity_checks.py`.
  **A number that fails these checks is refused before anything is paid for.**
- `register`: `surepass` or `practice`. A caller may use only the registers its settings allow (4.6).
- `accept_kept_answer_days` (optional, 0 to 366, default 0): when it is more than 0 and this register gave a real answer
  (FOUND or NOT_FOUND) for the same number within that many days, the service returns that answer, `reused: true`, and
  pays for nothing. 0 means "check now". The caller decides; the service never decides that an old answer is good
  enough.
- **A double click is one paid call.** A fresh check of the same number on the same register within 60 seconds of a real
  answer returns that answer (`reused: true`).
- Any field not listed is refused.

### 4.4 What a check answers

Every check answers `200` with an outcome, whatever SurePass did. A failed SurePass call is an outcome, not an error.

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
  "answer": { "registered_name": "PRACTICE CRANES PRIVATE LIMITED", "holder_type": "COMPANY" },
  "register_reference": "SurePass's own reference for this answer (its client_id)",
  "register_time": "2026-11-20T10:15:00Z",
  "checked_at": "2026-11-20T10:15:01Z",
  "reused": false,
  "charged": true
}
```

**Outcomes.** Only `FOUND` and `NOT_FOUND` are answers about the number. The others mean "no answer yet" and are never
kept or reused.

| Outcome | Means | `reason` (plain English, names the register) |
| --- | --- | --- |
| `FOUND` | The register holds the number; `answer` is filled | none |
| `NOT_FOUND` | The register has no record of the number | "SurePass has no record of this number." |
| `NO_ANSWER` | The register did not answer: down, slow or busy | "SurePass did not answer. Check again later." |
| `NOT_SET_UP` | Not set up: no key, the key refused, or this register not allowed for this caller | "Identity checks with SurePass are not set up for this caller." |
| `LIMIT_REACHED` | This caller's limit for today on this register is used up; nothing was called | "Today's limit of SurePass checks is used up. Check again tomorrow." |
| `REFUSED_INPUT` | The register refused the request itself | "SurePass refused the request. Please tell support." |

**Answers.** Field names are the service's own. None of SurePass's names crosses the contract.

- PAN: `registered_name`, `holder_type`. The holder type is one of `COMPANY`, `PERSON`, `HUF`, `FIRM`,
  `ASSOCIATION_OF_PERSONS`, `TRUST`, `BODY_OF_INDIVIDUALS`, `LOCAL_AUTHORITY`, `ARTIFICIAL_JURIDICAL_PERSON`,
  `GOVERNMENT`. It is read from SurePass's `category`, or from the PAN's 4th letter.
- GSTIN: `legal_name`, `trade_name`, `registration_status` (as the GST network words it), `is_active`,
  `registered_address`, `constitution_of_business`, `taxpayer_type`, `registered_on`, `cancelled_on` (dates
  `YYYY-MM-DD` or null).
- GSTINs under a PAN: `gstins`, a list of `gstin`, `state_code`, `state_name`, `registration_status`, `is_active`.

These are exactly the CRM's normalized answers (`backend/app/modules/identity_validation/providers/base.py`), so the
CRM's adapter is a thin translation.

### 4.5 Refusals: nothing checked, nothing charged

| Status | When |
| --- | --- |
| 400 | Wrong shape: unknown field, wrong type, a malformed PAN or GSTIN, a GSTIN whose check character does not fit |
| 401 | No credential, or a wrong or expired one (Isomorph) |
| 403 | The action is not allowed for this credential (Isomorph); or a signed-in person who is not a builder |
| 404 | `get-check`: no such check for this caller. A caller never reads another caller's checks |
| 409 | The same `request_id` sent earlier by this caller with a different request |

**Same request again.** The same `request_id` with the same request (kind, number, register and
`accept_kept_answer_days`) returns the first answer, `replayed: true`, with nothing new paid or written. To check
again after `NO_ANSWER`, the caller sends a **new** `request_id`. Two identical requests sent at the same moment give
one paid call and one replay.

### 4.6 Settings, limits and the call log

- **Callers' settings**, one per credential (`service:<clientId>`): a name, the registers it may use, and its daily
  limit on each register. A caller with no settings may use the practice register only.
- **Daily limits** count per caller and per register, per India day (midnight to midnight, Asia/Kolkata). Two checks
  arriving together at the limit: one passes, the other gets `LIMIT_REACHED`. The practice register has a limit too,
  so the limit can be tested without paying.
- **The call log.** Every call is recorded: caller, action, `request_id`, kind, number, register, outcome, `charged`,
  `reused`, `replayed`, `check_id`, SurePass's reference, time taken, and when. Isomorph has no viewer for incoming calls
  yet, so this log is how PBL sees use and cost.
- **The page.** For builders only: today's use per caller, the recent call log (each number masked except its last 4
  characters) and the callers' settings. Callers' settings are changed only by a builder. Every change is kept: who
  made it, when, and from what value to what value.
- **How long answers are kept** is a PBL policy not yet decided. Build no deletion. List it as an open question.

### 4.7 The practice register

- A file of **invented** numbers kept with the code, each with its answer. Any number not in it is `NOT_FOUND`.
- Start from the CRM's file, `backend/app/modules/identity_validation/providers/practice_register.json`, with the same
  numbers and answers, so that the CRM's test sites work unchanged through this service.
- Add invented numbers that make the practice register give **every** outcome: `NO_ANSWER`, `NOT_SET_UP`,
  `REFUSED_INPUT`, a slow answer just inside the time limit, a cancelled GSTIN, and a PAN with several GSTINs.
  Mark them clearly. New practice numbers **begin `ZZZZ`**: a real PAN's 4th letter is never Z, so none can be a real
  company's.

### 4.8 The SurePass adapter inside the service

- Two settings, in Isomorph's console: `SUREPASS_BASE_URL` (live `https://kyc-api.surepass.app/api/v1`, test
  `https://sandbox.surepass.app/api/v1`) and the key, `SUREPASS_API_TOKEN`, sent as `Authorization: Bearer <key>`.
- Paths: PAN `/pan/pan`, GSTIN `/corporate/gstin`, GSTINs under a PAN `/corporate/gstin-by-pan`.
- **Reply to outcome.** This is the CRM's tested mapping (`providers/surepass.py`, `_outcome`):

  | SurePass replies | Outcome |
  | --- | --- |
  | 200 with `success: true` and a complete answer (guards below) | `FOUND` |
  | 200 with anything else, including `success: false` | `NO_ANSWER` |
  | 404 or 422 with a JSON body saying `success: false` | `NOT_FOUND` |
  | 404 otherwise (a wrong address) | `NOT_SET_UP` |
  | 422 otherwise | `NO_ANSWER` |
  | 400 | `REFUSED_INPUT` |
  | 401, 403 | `NOT_SET_UP` |
  | 429, 5xx, timeout (20 seconds), network failure | `NO_ANSWER` |

- **Guards from the CRM:**
  - an answer whose own number is not the number asked is `NO_ANSWER`, never `FOUND`;
  - SurePass writes "no date" as `1800-01-01`, which is read as null;
  - an answer missing what it rests on is `NO_ANSWER`: a PAN with no registered name, a GSTIN with no status, a
    "GSTINs under a PAN" reply with no list (no list is not "none"), or a list holding a GSTIN of another PAN;
  - SurePass's limit is 100 calls a minute: never retry in a loop.
- **Unit-test the reading of replies** with recorded replies built from SurePass's published examples, with invented
  values (`docs/agent/slices/surepass-api-mapping-research.md` in the CRM repository). The first real call confirms the
  field names. Any correction is made in the adapter only.

---

## 5. Working method: the same scheme as the CRM

**The rules are in the repository from the first commit:** `docs/rules/WORKING_METHOD.md`, `CODING_STANDARDS.md`,
`TESTING.md` and `REVIEW_METHOD.md`, from `pbl-transport/pbl-dev-standards`. They are the method the CRM is built by,
made to fit an Isomorph app, and they win where they differ from the isomorph skill. In short, every package goes:
plan, build, focused tests each with its undo proof, full checks with exact counts, self-review, Codex review rounds
(after the third, more whenever a material finding was fixed, and the owner asked when the builder is in doubt; each
round after the ninth only on the owner's word for that round), every
finding decided by the builder and recorded, the records closed, then the owner's audit. Merging, and a pull request where there is one, only
on the owner's word.

**Roles.** The builder (the PBL team member) runs Claude Code and Codex and decides every review finding. Claude Code
builds, tests and keeps the records. Codex reviews independently. The owner approves and audits. PBL's assessor
(section 6) tests the finished work on its own.

**Packages, in order.**

1. **Package 01: contract, scope and design.** The contract, its fixtures, `docs/SCOPE.md` and `docs/DESIGN.md`, with
   every open question listed. No code. Codex reviews the documents; the assessor reviews the contract; **the owner
   approves it**. From then on the contract changes only by a new version, approved the same way.
2. **Package 02: the service on the practice register.** Actions, tables with row-level rules, the settings, limits and
   call log, the page, journeys and unit tests. `isomorph check` passes. If its plan is bigger than the rules allow,
   split it, and the later numbers move up.
3. **Package 03: the SurePass adapter,** unit-tested with recorded replies; still no real call. Then the private
   preview deploy, and a few practice-register checks from outside with a credential (external access and the
   credential on the owner's word).
4. **Handover** (section 7).
5. **PBL's assessment** on the preview (section 6). Its findings come back as a package of their own.
6. **Real numbers.** The key holder enters the SurePass key in the console. The owner runs PBL's own PAN and GSTINs and
   a few others from their list, with a daily limit of 10.
7. **Production,** only on the owner's word. After that the CRM switches to the service in a CRM package of its own,
   keeping its direct SurePass adapter as a fallback.

**What the owner sees.** For each package: its record (`docs/packages/`), every Codex reply (`docs/reviews/`), and
`docs/STATUS.md`. The owner audits each package against `audit/DISCIPLINE_AUDIT.md` in `pbl-dev-standards`, running
some checks and an undo proof again: closely at first, and less as packages pass with no lapse.

---

## 6. What PBL will test on its own

PBL's assessor writes and runs its own tests from the approved contract, from the owner's laptop, with its own
credential. It does not reuse the team's tests. The team should expect at least these checks, and pass them on the
preview before handover.

| # | Check |
| --- | --- |
| 1 | No credential, a wrong one, an expired token: 401. An action the credential is not allowed: 403 |
| 2 | A signed-in person who is not a builder cannot run any action |
| 3 | Unknown field, wrong type, malformed PAN, malformed GSTIN, wrong check character: 400, nothing logged as paid |
| 4 | Practice register: every outcome in 4.4 reached by its practice number, with the right `reason` |
| 5 | Every answer's fields exactly as 4.4: no SurePass field name, no raw reply, `contract_version` present |
| 6 | Same `request_id`, same request: the first answer, `replayed: true`, no new call. Same id, different number: 409 |
| 7 | Two identical requests at the same moment: one check, one replay |
| 8 | `accept_kept_answer_days`: a kept answer within the days is reused and not charged; 0 makes a new check |
| 9 | The 60-second double-click rule |
| 10 | Daily limit, on the practice register: the next check after the limit is `LIMIT_REACHED`; two at the limit, one passes |
| 11 | `NO_ANSWER` is never reused or kept as an answer; a new `request_id` checks again |
| 12 | `get-check` reads only the caller's own checks; another caller's check is 404 |
| 13 | `my-usage` matches the call log |
| 14 | The call log records every call, including refusals that reach the action, with the caller as `service:<clientId>` |
| 15 | No key, number, name or reply body in any answer, error or log line the assessor can see |
| 16 | Real numbers (section 5, step 6): PBL's PAN found with its registered name; its GSTINs listed under it; each GSTIN's status |

The assessor's Codex also reviews the repository at the handover commit.

---

## 7. Handover: what the team gives PBL

- The commit hash, and the preview build deployed from exactly that commit.
- The app id, the preview address and its API address.
- `docs/HANDOVER.md`: what was built; every command run, with exact results; known gaps; open questions.
- Every package record and every review result, with `docs/STATUS.md` and `docs/OPEN_ITEMS.md` current.
- The contract at version 1.0, with its fixtures.
- **The owner added as a builder of the app.** The assessor's credential (all five actions; practice register, and
  SurePass with a limit of 10 a day) is created by the owner on the owner's own machine, so its secret never travels.
  If only the app's creator can make credentials, the secret is handed over through a password manager, never by
  email or chat.

---

## 8. Questions for Isomorph (the owner asks them before package 03's preview deploy)

1. Are external access, service credentials and the November fixes live on the **production** platform, where PBL's
   tenant is (`platform.isomorph.ai/t/pbl`), or only on beta? What is the token address there?
2. In which AWS region are PBL's tenant's data and backups kept? (Answers include names of people who hold PANs.)
3. The PBL tenant's Source control says Isomorph creates a private repository for each app in PBL's GitHub
   organization (`pbl-transport`), and the kit's guide says a builder is added with `isomorph github <username>`. Is the
   repository created at the first deploy, and can we choose its name (`pbl-identity-checks`)? Which branch does a
   deploy write to? Can the team push their own branches to it, with `main` changed only by an approved merge, or does
   every deploy write to `main` itself?
4. Can an app have several builders, and which of them may create service credentials?
5. Are outgoing calls from actions to `kyc-api.surepass.app` and `sandbox.surepass.app` allowed on PBL's tenant, or must
   they be added to a list?
6. Where can PBL read or export the platform's audit log of incoming calls, and for how long is it kept?

---

## 9. Not in version 1

Driving licences and vehicle registrations (Hiring's crew and machines; the mapping research covers them for later),
company details by CIN, PAN comprehensive, bank accounts, webhooks, any screen beyond the builders' page, deleting
old answers, and **any change to the CRM**. The CRM's adapter to this service is the CRM project's own later package.

---

## 10. Background reading from the CRM repository `pbl-crm-hiring`

These files are copied, to read only, into `pbl-dev-standards` under `projects/identity-checks/crm-reference/`, at the
CRM's commit `a6901758`, keeping their CRM paths. The paths below are within that folder.

| Read | For |
| --- | --- |
| `docs/agent/slices/surepass-api-mapping-research.md` | SurePass: addresses, key, paths, fields, errors, limits, cost |
| `backend/app/modules/identity_validation/providers/base.py` | The normalized answers this contract mirrors |
| `backend/app/modules/identity_validation/providers/surepass.py` | The tested reading of SurePass's replies and its guards |
| `backend/app/modules/identity_validation/contract.py` | Outcomes, reasons, holder types, the 60-second rule |
| `backend/app/modules/identity_validation/providers/practice_register.json` | The practice numbers to start from |
| `backend/app/modules/accounts/identity_checks.py` | PAN and GSTIN format and the GSTIN check character |
| `backend/tests/test_idv1_account_identity_checks.py` | How the CRM fakes SurePass's replies in tests |
| `docs/agent/slices/idv-1-account-identity-checks.md`, `idv-1a-identity-checks-on-request.md` | The owner's decisions behind the CRM's checks (S1 to S7, IDV-1a) |
| `docs/agent/contracts/account-identity-validation-contract.md` (AIV-001) | What the CRM expects of an identity check, including during an outage |
| `docs/agent/contracts/shared-module-contract-foundation.md` (MCF-001) | PBL's rules for request keys, versions and errors |
| `docs/agent/architecture/BOUNDED_INDEPENDENT_REVIEW_METHOD.md` | How a Codex review round is packed and reported |

### Isomorph lessons PBL has already paid for (November 2026 tests)

1. **Journeys load the SDK like this:** `await import(process.env.ISOMORPH_SDK_MODULE ?? "@isomorph.ai/app-sdk")`.
   `isomorph check` runs them from a temporary copy without `node_modules`.
2. **Every trusted action needs a journey** that calls it as `identity: "second-user"` and checks that it is refused.
3. **`.forUpdate()` inside `ctx.transaction` needs an UPDATE row-level policy on the table**; without one it returns no
   row. The daily limit and the request-id lock depend on this.
4. **`expose.input` is checked only for outside callers.** A builder's call from inside the app skips it, so each action
   refuses unknown fields and wrong types itself.
5. **External access, and any change to what is exposed, take effect only at the next deploy of changed code.**
6. **Secrets.** `.isomorph/local/secrets.env` is copied to the console **only on the first deploy**. After that, change
   a secret in the console's App setup: production takes it at once, preview at its next deploy. **Never end a secret's
   name in `_SIGNING_SECRET`, `_JWT_SECRET`, `_SESSION_SECRET`, `_COOKIE_SECRET` or `_CSRF_SECRET`**: Isomorph reads
   those as its own sign-in keys.
7. `isomorph deploy` needs `--change "<what changed>"`. The CLI's sign-in expires: `isomorph login --json` gives a link;
   sign in, then `isomorph login --code <code>`.
8. An action has at most 5 minutes. Service tokens last one hour: callers keep theirs and fetch a new one before it ends.
9. The CLI needs Node 24.20 or later.
