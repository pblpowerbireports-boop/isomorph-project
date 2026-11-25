# Status

Where the work stands and what comes next. Updated at every step of every package.

Updated: 2026-11-25, package 01 Codex round 4 corrections applied; round 5 ready to run.

## Where it stands

Package 01 **returned by owner's audit** (21 November 2026): 8 items decided, Phase C fixes applied, Codex
**round 4** run (2026-11-25, commit `06ba78d`): `CORRECTION_REQUIRED` with 6 material and 1 advisory
findings (R4.1..R4.7), each decided and committed (`44956c2`, `735c3bc`, `57f9e45`, `2eb0bf1`, `e1ca5ec`,
`0531c19`, `cc529c8`). Phase E fixes applied in 5 grouped commits (`2b64a28`, `f03e745`, `130ea45`,
`afa1f38`, `23e6580`) plus `§10` change entries.

Fixture count: 40 (added `no-answer-token-lost.json` for R4.2; `reused-after-wait.json` reworked to share
request_id with `found-slow.json` per R4.3). All fixtures parse as valid JSON.

**Codex round 5** is next, with its focus the Round 4 findings and their fixes (what the owner's new rule
requires after any material fix).

## Current package

Package 01, the contract, scope and design. Status: Codex round 5 ready to run on branch
`pkg/01-contract-scope-design`.

## Next

- Build the round-5 packet: `node scripts/review/build-packet.mjs --package 01-contract-scope-design --round 5 --base 5e4566c`.
  The builder (Naidu) runs Codex with the printed command.
- Record the result with `node scripts/review/check-result.mjs --package 01-contract-scope-design --round 5`;
  put each finding in the package record.
- If round 5 finds material or blocking: fix in new commits and run round 6. Up to round 9 the builder
  decides; beyond round 9 only on the owner's permission per round.
- When ACCEPTED (or each remaining finding decided with a reason): builder rewrites "Builder's own checks"
  in their own words (A-L4).
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
