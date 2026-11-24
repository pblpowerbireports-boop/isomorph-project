# Status

Where the work stands and what comes next. Updated at every step of every package.

Updated: 2026-11-24, package 01 owner-audit corrections applied; Codex round 4 ready to run.

## Where it stands

Package 01 **returned by owner's audit** (21 November 2026) with 4 lapses, 4 material findings and 3 advisories.
All 8 items decided by the builder (commits `d9a3b9d`, `cbd7dc6`, `1b7a84f`, `52b9cf8`, `c7b0c5b`, `7308277`,
`33b7d60`, `2610490`), each with a per-finding reason recorded (no more "fix all"). Fixes applied in 9 grouped
Phase C commits (`87bc007`, `ce72965`, `1b95d24`, `0f864fc`, `4c69508`, `963dc4c`, `87d13dd`, `6411293`,
`0e1a534`). Fixture count: 39 (was 34; added `reused-after-wait`, `found-slow`, `no-answer-timeout`,
`reused-surepass`, `not-set-up-builder`). All fixtures parse as valid JSON.

Rounds 1–3 and the three Codex `CORRECTION_REQUIRED` results stand. **Codex round 4** is set up at
`.review/01-contract-scope-design/round-4/focus.md`, with the audit's findings as its focus.

## Current package

Package 01, the contract, scope and design. Status: Codex round 4 ready to run on branch
`pkg/01-contract-scope-design`.

## Next

- Build the round-4 packet: `node scripts/review/build-packet.mjs --package 01-contract-scope-design --round 4 --base 5e4566c`.
  The builder (Naidu) runs Codex with the printed command.
- Record the result with `node scripts/review/check-result.mjs --package 01-contract-scope-design --round 4`;
  put each finding in the package record.
- If round 4 finds material or blocking: fix in new commits and run round 5. Up to round 9 the builder decides;
  beyond round 9 only on the owner's permission per round.
- When ACCEPTED (or each remaining finding decided with a reason): builder rewrites "Builder's own checks" in
  their own words (A-L4).
- Send the owner a new bundle: `git bundle create pbl-identity-checks-<commit>.bundle --all`.
- No merge, push to main, or deploy without the owner's word.

## Packages

| # | Name | Status | Record |
| --- | --- | --- | --- |
| 01 | Contract, scope and design | corrections in progress (owner's audit) | `docs/packages/01-contract-scope-design.md` |

## Owner's decisions

Every answer the owner gives, in the owner's own words (`WORKING_METHOD.md`, section 3).

| Date | Question | The owner's answer |
| --- | --- | --- |
| 2026-11-21 | Whose kept answers may be reused (audit finding C5)? Recommendation: any caller's `FOUND` or `NOT_FOUND` answer may be reused under `accept_kept_answer_days`; check records and `get-check` stay per caller; the 60-second double-click rule stays per caller. | "I agree with all your recommendations" |
| 2026-11-21 | How long check records and call log entries are kept (open item 1)? Recommendation: keep everything for now and build no deletion; decide before production. | "I agree with all your recommendations" |
| 2026-11-21 | `holder_type: null` when neither the category nor the 4th letter maps (open item 2)? Recommendation: yes; `null` means "not known", as in the CRM. | "I agree with all your recommendations" |
| 2026-11-21 | An empty GSTIN list from `gstins-by-pan` (open item 3)? Recommendation: `FOUND` with an empty list, as in the CRM; "this PAN has no GST registrations" is an answer about the PAN. | "I agree with all your recommendations" |
| 2026-11-21 | Review rounds after the third: a change to the working rules (`WORKING_METHOD.md`, section 2, step 6, and section 3; `REVIEW_METHOD.md`, section 2; the record template; the brief, section 5). | "After round 3, if you find that there are material errors, then run more rounds; for other types or errors, make a judgement and if they appear important / serious, run more rounds; if in doubt, let me decide." Then: "Let him decide until round 9 and beyond that let him ask me." |
