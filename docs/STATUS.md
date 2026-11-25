# Status

Where the work stands and what comes next. Updated at every step of every package.

Updated: 2026-11-25, package 01 Codex round 6 decisions recorded; round 7 is the final round.

## Where it stands

Codex **round 6** (2026-11-25, commit `d033879`) returned `CORRECTION_REQUIRED` with 7 material findings
(R6.1..R6.7). Builder's decision per `WORKING_METHOD.md` §2 step 6 ("decide that the errors left are not
important to fix now, write a reason, and write deferred items into OPEN_ITEMS"):

- **R6.5, R6.6, R6.7 fixed** in this round's scaffold+fix commits: 409 `check_id` exception stated in
  §7.4 and D-13; §7.4's `answered_at` row rewritten to mirror §4; A-L1..A-C7 findings-table rows now
  carry their fixing-commit SHAs.
- **R6.1..R6.4 deferred** to `docs/OPEN_ITEMS.md` items 5, 6, 7, 8 — four concurrency edge cases in the
  §7.2 / D-06 state machine, better specified against Package 02's actual code and journey tests than in
  further prose. §10 change 45 records the deferral.

**Codex round 7 is the final review round on this branch** (builder's call, 2026-11-25). Any findings it
returns will be deferred by the same reason and the package closed for the owner's re-audit. The owner
may accept, push back on specific deferrals, or ask for more rounds.

Fixture count: 40 (unchanged). All parse as valid JSON.

## Current package

Package 01, the contract, scope and design. Status: Codex round 7 ready to run on branch
`pkg/01-contract-scope-design`. This is the final round before close.

## Next

- Build the round-7 packet: `node scripts/review/build-packet.mjs --package 01-contract-scope-design --round 7 --base 5e4566c`.
  The builder (Naidu) runs Codex with the printed command.
- Record the result with `node scripts/review/check-result.mjs --package 01-contract-scope-design --round 7`;
  put each finding in the package record.
- **Whatever round 7 returns**, close the round: `ACCEPTED` → done; any findings → decide each as
  "Deferred to OPEN_ITEMS (same reason as R6.1..R6.4)" with the owner's call to accept or not.
- Builder (Naidu) rewrites "Builder's own checks" (section 5) in their own words (A-L4 rule — only the
  builder).
- Update STATUS.md to "awaiting owner's re-audit".
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
