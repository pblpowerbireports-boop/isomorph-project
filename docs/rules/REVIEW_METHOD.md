# Review method

How Codex reviews a package. It is PBL's bounded review method, as used on the CRM + Hiring application.

## 1. What a review is for

A reviewer who did not write the code looks for what no test was written to catch: a case nobody thought of, an
unintended effect, a wrong assumption, a record that says something the code does not do. It does not replace tests.
A change that passes review but has no test protecting its main rule is not adequately tested, and the review should
say so.

The reviewer sees **only the packet**: one commit, its diff, the whole text of the changed files, the files they work
with, the contract, the rules and the evidence. It runs nothing and opens nothing else. So everything a claim rests on
must be in the packet.

## 2. When

- After a package's full checks pass (`WORKING_METHOD.md`, section 2, step 6).
- Package 01, which writes documents only, is reviewed the same way, on the documents.
- At most three rounds per package. **Each round after the third only on the owner's permission for that one round**,
  never chained, never assumed from an earlier permission.

## 3. One round, step by step

Run these from Bash (Git Bash on Windows), in the repository's root folder. `<pkg>` is the package's name, for example
`02-practice-register`, and `<n>` the round's number.

1. **Commit everything.** The folder must be clean: a round reviews one commit.
2. **Write the round's focus** in `.review/<pkg>/round-<n>/focus.md`:
   - what the package does, in a few lines;
   - **what to check specifically**: each rule the package claims, each path where it could go wrong, each place where
     a record makes a promise about the code;
   - for round 2 and later: what changed since the last round, finding by finding;
   - what is the owner's decision and not for the reviewer to reopen (whether the code does it exactly is).
3. **Build the packet:**

   ```bash
   node scripts/review/build-packet.mjs --package <pkg> --round <n> --include <path> --include <path>
   ```

   `--include` adds files the change works with but did not change: callers, shared helpers, the migrations of the
   tables it uses. `--base <commit>` sets the starting commit when it is not where the branch left `main`. The script
   refuses if the folder is not clean, if the focus is missing, or if the packet is too large. It prints the Codex
   command.
4. **Run Codex** with the command it printed. It takes a few minutes.
5. **Check and record the result:**

   ```bash
   node scripts/review/check-result.mjs --package <pkg> --round <n>
   ```

   It checks that the reply has the right form and names the very packet sent, then writes
   `docs/reviews/<pkg>/round-<n>.json` and lists the findings. A reply that fails the check counts as
   `MODEL_ESCALATION_REQUIRED`, never as accepted.
6. **Put every finding in the package record's findings table**, numbered as the script lists them, with the builder's
   decision.
7. **Commit** the result file and the record.

## 4. What the result means

| State | Means | Do |
| --- | --- | --- |
| `ACCEPTED` | No blocking or material defect found | Record it. Any advisory is fixed or written into `docs/OPEN_ITEMS.md`. |
| `CORRECTION_REQUIRED` | At least one defect | Decide each finding, correct, run the focused tests and undo proofs, then a new round on the corrected commit. |
| `MODEL_ESCALATION_REQUIRED` | The packet was not enough to judge, or the reply failed the check | Add the code the claims rest on (`--include`) and send it again as the same round, named `<n>b`, saying so in the focus. |
| `HUMAN_DECISION_REQUIRED` | A business judgement, not a defect | Put it to the owner. |

## 5. Deciding a finding

Every finding is the builder's to decide, with Claude's recommendation. Check it against the code yourself first: the
reviewer can be wrong. Then record one of:

- **Fix.** Correct it, add the test that now catches it, and record its undo proof and the fixing commit.
- **Not a defect.** Say why, pointing at the code or the test that shows it. "Out of scope" is not a reason when the
  defect is real: a real gap the reviewer finds, even an old one, is fixed.
- **Owner decides.** When it is a business question (`WORKING_METHOD.md`, section 3).
- **Advisory, kept.** An advisory that is not fixed is written into `docs/OPEN_ITEMS.md`, and the table says so.

## 6. Rules

- A new round always reviews a fresh packet of the corrected commit. Never continue an earlier reviewer conversation.
- Never edit a result. Once a round is `ACCEPTED`, any later change to the code is a new round.
- Never cut code from a packet to make it fit: the reviewer then judges claims it cannot see and returns
  `MODEL_ESCALATION_REQUIRED`. Leave out long summary documents first.
- A packet carries only committed files. Nothing secret is committed, so nothing secret reaches the reviewer.
- The model and its settings are in `scripts/review/build-packet.mjs`. They change only on the owner's word.

## 7. Lessons PBL has paid for

- A diff can cut a function in half and mislead the reviewer. The packet carries every changed file whole.
- The reviewer judges what the code does now, including gaps older than the package. Fixing a real old gap usually
  costs less than arguing about scope.
- Word each instruction in the focus as the rule actually meant. "Must not let a file of the wrong type through" was
  read as the file's content, not its name.
- A fix that adds a parser makes the parser the next round's target. Write it defensively from the start: check every
  count, refuse what does not fit, bound memory by the input's size, and turn any exception into a refusal.
- After a correction, build the packet again before sending, to see that nothing it needs has moved.
