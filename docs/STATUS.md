# Status

Where the work stands and what comes next. Updated at every step of every package.

Updated: 2026-11-26, package 01 branch closed on the builder's side; **awaiting owner's re-audit**.

## Where it stands

Package 01's branch `pkg/01-contract-scope-design` is closed on the builder's side at commit
`817bb0e`. §5 ("Builder's own checks") is written by the builder in their own words, per A-L4 and
`WORKING_METHOD.md` §1 ("only the builder writes §5. Claude never writes it and never suggests its
words"). The branch is handed to the owner for re-audit.

Codex round history on this branch (R4..R7) is recorded in `docs/reviews/01-contract-scope-design/`.
Round 7 (2026-11-25, commit `70c5443`) returned `CORRECTION_REQUIRED` with 10 material findings
(R7.1..R7.10). Breakdown of builder's decisions:

- **Fixed in the round-7 closing commit `70e10d1`**: R7.1 (D-13 self-contradiction introduced by the
  round-6 closing commit), R7.7 (SCOPE's `call_log` inventory missing §7.4 columns), R7.8
  (fixture-parse check re-run on current tip — 40/40 valid JSON), R7.9 (active-file scrub of
  "Naidu"), R7.10 (A-L4 fixing-commit wording qualified).
- **Re-assertions of R6.1..R6.4**: R7.2/3/4/5 — same decision as R6, same OPEN_ITEMS items 5–8.
- **New OPEN_ITEMS**: R7.6 → item 9 (`my-usage` counting semantics, owner decides); R7.9 → item 10
  (historical "Naidu" disclosure in earlier commits, owner decides).

**No further review rounds on this branch.** Per `WORKING_METHOD.md` §2 step 6 the builder may stop
when "the errors left are not important to fix now", recording reasons and deferring items. The
owner's re-audit decides whether to accept each deferral.

Fixture count: 40 (40/40 valid JSON on tip `469fb9f`; §5 rewrite in `817bb0e` touches no fixtures).

## Current package

Package 01, the contract, scope and design. Status: **awaiting owner's re-audit** at commit
`817bb0e` on branch `pkg/01-contract-scope-design`. No merge to `main`, no deploy.

## Next

- Owner audits the branch against `audit/DISCIPLINE_AUDIT.md` in `pbl-dev-standards`.
- Owner's findings (if any) come back to the builder; each goes into the findings table with the
  builder's decision; corrections run as a new round on a new commit (per `WORKING_METHOD.md` §2
  step 9).
- If owner approves, merge to `main` on the owner's word; then open Package 02 (the service on the
  practice register).
- `isomorph check --app-root . --json` on this branch's final commit is **not yet recorded in §3
  Checks** — the §5-rewrite commit `817bb0e` touches only prose in the package record and changes
  no fixture, schema or code; the last recorded `isomorph check` was on `06ba78d` (Phase D). If the
  owner wants a fresh `isomorph check` recorded on `817bb0e`, the builder runs it and amends §3.

## Packages

| # | Name | Status | Record |
| --- | --- | --- | --- |
| 01 | Contract, scope and design | awaiting owner's re-audit (tip `817bb0e`) | `docs/packages/01-contract-scope-design.md` |

## Owner's decisions

Every answer the owner gives, in the owner's own words (`WORKING_METHOD.md`, section 3).

| Date | Question | The owner's answer |
| --- | --- | --- |
| 2026-11-21 | Whose kept answers may be reused (audit finding C5)? Recommendation: any caller's `FOUND` or `NOT_FOUND` answer may be reused under `accept_kept_answer_days`; check records and `get-check` stay per caller; the 60-second double-click rule stays per caller. | "I agree with all your recommendations" |
| 2026-11-21 | How long check records and call log entries are kept (open item 1)? Recommendation: keep everything for now and build no deletion; decide before production. | "I agree with all your recommendations" |
| 2026-11-21 | `holder_type: null` when neither the category nor the 4th letter maps (open item 2)? Recommendation: yes; `null` means "not known", as in the CRM. | "I agree with all your recommendations" |
| 2026-11-21 | An empty GSTIN list from `gstins-by-pan` (open item 3)? Recommendation: `FOUND` with an empty list, as in the CRM; "this PAN has no GST registrations" is an answer about the PAN. | "I agree with all your recommendations" |
| 2026-11-21 | Review rounds after the third: a change to the working rules (`WORKING_METHOD.md`, section 2, step 6, and section 3; `REVIEW_METHOD.md`, section 2; the record template; the brief, section 5). | "After round 3, if you find that there are material errors, then run more rounds; for other types or errors, make a judgement and if they appear important / serious, run more rounds; if in doubt, let me decide." Then: "Let him decide until round 9 and beyond that let him ask me." |
