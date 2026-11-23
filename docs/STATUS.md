# Status

Where the work stands and what comes next. Updated at every step of every package.

Updated: 2026-11-23, package 01 returned by owner's audit; corrections in progress.

## Where it stands

Package 01 **returned by owner's audit** (21 November 2026): 4 lapses, 4 material findings, 3 advisories. We are in
step 7 of `WORKING_METHOD.md` (corrections). Final commit of the first attempt was `e8fd983`; a round 4 Codex review
was not run and must now be, with the audit as its focus. Rounds 1–3 and the three Codex `CORRECTION_REQUIRED` results
stand.

## Current package

Package 01, the contract, scope and design. Status: corrections to the owner's audit in progress on branch
`pkg/01-contract-scope-design`.

## Next

- Record the builder's decision on each audit finding (`docs/packages/01-contract-scope-design.md`).
- Apply fixes in new commits (never amend or rebase a reviewed commit).
- Run Codex round 4 with the audit as its focus; more rounds if material findings are found, up to round 9 (and
  beyond round 9 only on the owner's permission for that round).
- Builder writes "Builder's own checks" again.
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
