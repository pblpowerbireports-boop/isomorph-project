# Status

Where the work stands and what comes next. Updated at every step of every package.

Updated: 2026-11-25, package 01 Codex round 7 decisions recorded; **branch review-closed, pending builder's §5 rewrite**.

## Where it stands

Codex **round 7** (2026-11-25, commit `70c5443`) returned `CORRECTION_REQUIRED` with 10 material
findings (R7.1..R7.10). Breakdown of builder's decisions:

- **Fixed in the round-7 closing commit**: R7.1 (D-13 self-contradiction my round-6 commit
  introduced), R7.7 (SCOPE's `call_log` inventory missing §7.4 columns), R7.8 (fixture-parse check
  re-run on current tip — 40/40 valid JSON), R7.9 (active-file scrub of "Naidu"), R7.10 (A-L4
  fixing-commit wording qualified to reflect that the §5 rewrite is the closing commit).
- **Re-assertions of R6.1..R6.4**: R7.2/3/4/5 — same decision as R6, same OPEN_ITEMS items 5–8.
- **New OPEN_ITEMS**: R7.6 → item 9 (`my-usage` counting semantics, owner decides); R7.9 → item 10
  (historical "Naidu" disclosure in earlier commits, owner decides).

**This is the last review round on this branch.** Per `WORKING_METHOD.md` §2 step 6 the builder may
stop when "the errors left are not important to fix now", recording reasons and deferring items. The
owner's re-audit decides whether to accept each deferral.

Fixture count: 40 (40/40 valid JSON on current tip `469fb9f`).

## Current package

Package 01, the contract, scope and design. Status: **awaiting the builder's §5 rewrite** on branch
`pkg/01-contract-scope-design`. Once that lands, the branch is ready for the owner's re-audit.

## Next

- **The builder rewrites "Builder's own checks" (section 5)** of the package record in their own
  words — per A-L4 and `WORKING_METHOD.md` §1, only the builder writes §5. See the cleared §5 of the
  package record for what to include (what the builder actually ran, opened, or compared; anything
  the builder found that Claude or Codex missed).
- The builder commits that rewrite as the closing commit of this branch.
- The builder re-runs `isomorph check --app-root . --json` on the closing commit and records the
  result in §3 Checks (the fixture-parse check is already recorded on `469fb9f`).
- Update STATUS.md to "awaiting owner's re-audit".
- Send the owner a new bundle: `git bundle create pbl-identity-checks-<commit>.bundle --all`.
- No merge, push to main, or deploy without the owner's word.

## Packages

| # | Name | Status | Record |
| --- | --- | --- | --- |
| 01 | Contract, scope and design | review-closed; awaiting builder's §5 and owner's re-audit | `docs/packages/01-contract-scope-design.md` |

## Owner's decisions

Every answer the owner gives, in the owner's own words (`WORKING_METHOD.md`, section 3).

| Date | Question | The owner's answer |
| --- | --- | --- |
| 2026-11-21 | Whose kept answers may be reused (audit finding C5)? Recommendation: any caller's `FOUND` or `NOT_FOUND` answer may be reused under `accept_kept_answer_days`; check records and `get-check` stay per caller; the 60-second double-click rule stays per caller. | "I agree with all your recommendations" |
| 2026-11-21 | How long check records and call log entries are kept (open item 1)? Recommendation: keep everything for now and build no deletion; decide before production. | "I agree with all your recommendations" |
| 2026-11-21 | `holder_type: null` when neither the category nor the 4th letter maps (open item 2)? Recommendation: yes; `null` means "not known", as in the CRM. | "I agree with all your recommendations" |
| 2026-11-21 | An empty GSTIN list from `gstins-by-pan` (open item 3)? Recommendation: `FOUND` with an empty list, as in the CRM; "this PAN has no GST registrations" is an answer about the PAN. | "I agree with all your recommendations" |
| 2026-11-21 | Review rounds after the third: a change to the working rules (`WORKING_METHOD.md`, section 2, step 6, and section 3; `REVIEW_METHOD.md`, section 2; the record template; the brief, section 5). | "After round 3, if you find that there are material errors, then run more rounds; for other types or errors, make a judgement and if they appear important / serious, run more rounds; if in doubt, let me decide." Then: "Let him decide until round 9 and beyond that let him ask me." |
