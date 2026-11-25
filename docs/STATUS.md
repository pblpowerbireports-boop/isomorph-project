# Status

Where the work stands and what comes next. Updated at every step of every package.

Updated: 2026-11-25, package 01 Codex round 5 corrections applied; round 6 ready to run.

## Where it stands

Codex **round 5** (2026-11-25, commit `19c8f5f`) returned `CORRECTION_REQUIRED` with 7 material findings
(R5.1..R5.7). Each decided and committed (`0051275`, `1856ddf`, `f1fa5ea`, `a5334e0`, `9cd6936`,
`cb37432`; R5.7 fixed inside scaffold commit `2757d72`). Phase F fixes applied in 3 grouped commits
(`bebd1b8`, `a9d4bc9`, `58d3e06`) plus §10 change entries 36–41.

Key design refinements in round 5: stale-claim takeover is now an atomic CAS (R5.1); each timing step
has a hard numerical bound totalling 30 s honest-path max, with takeover wait at 45 s (R5.2); token-loss
NO_ANSWER is atomically finalised so the returned `check_id` is durable (R5.3); `answered_at ≥
checked_at` for new checks and the slow fixtures show the real 18-second gap (R5.4); 409 refusals are
logged (R5.6).

Fixture count: 40 (unchanged from round 5). All parse as valid JSON.

**Codex round 6** is next, focused on the Round 5 fixes.

## Current package

Package 01, the contract, scope and design. Status: Codex round 6 ready to run on branch
`pkg/01-contract-scope-design`.

## Next

- Build the round-6 packet: `node scripts/review/build-packet.mjs --package 01-contract-scope-design --round 6 --base 5e4566c`.
  The builder (Naidu) runs Codex with the printed command.
- Record the result with `node scripts/review/check-result.mjs --package 01-contract-scope-design --round 6`;
  put each finding in the package record.
- If round 6 finds material or blocking: fix in new commits and run round 7. Up to round 9 the builder
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
