# Working method

How every piece of work in this repository is done, checked and recorded. It is the same method PBL uses on its CRM +
Hiring application, made to fit an Isomorph app. The brief (`docs/brief/BUILD_BRIEF.md`) says what is built; this file
says how.

## 1. Who does what

| Who | Does |
| --- | --- |
| **The builder** (the PBL team member) | Runs Claude Code and Codex. Decides every review finding. Writes the "Builder's own checks" section of each package record. Asks the owner where section 3 says so. |
| **Claude Code** | Builds, tests and writes the records. Explains each step in plain words. Puts every finding to the builder with a recommendation. Never decides a finding and never writes the builder's own section. |
| **Codex** | The independent reviewer. It sees only the packet for one round (`REVIEW_METHOD.md`), never the repository. |
| **The owner** | Approves the contract, scope and design, gives the permissions in section 3, decides what is theirs to decide, and audits each package. |
| **PBL's assessor** | Tests the finished work on its own, from the contract, with its own tests and its own Codex review. |

## 2. The work comes in packages

A package is one piece of work the owner can check in 10 to 20 minutes. Packages are numbered `01`, `02`, and so on,
and listed in `docs/STATUS.md`. If a plan would take more than about a day's work, or its check more than 20 minutes,
split it and say so in the plan.

Each package has:

- one branch, `pkg/NN-short-name`, cut from `main`;
- one record, `docs/packages/NN-short-name.md`, started from `docs/packages/_TEMPLATE.md`;
- its review results, `docs/reviews/NN-short-name/round-N.json`.

### A package, step by step

1. **Plan.** Fill in the record's Plan: what the package does and does not do; the reading list (every section of the
   brief, part of the contract, rule and `docs/DESIGN.md` decision it relies on, each read in full); the files to
   change; each rule to protect and the test that will protect it; the risks; questions for the owner. Read
   `docs/OPEN_ITEMS.md` and close what the package can. A package that would change the contract, `docs/SCOPE.md`, the
   brief or these rules stops here until the owner approves.
2. **Build.** Small commits on the package branch. `docs/SCOPE.md` and `docs/DESIGN.md` are updated in the same commit
   as the code they describe. Every table change is a migration. The isomorph skill's rules apply, except where section
   4 says otherwise.
3. **Focused tests.** For each rule the package adds or changes: a test, and that test's undo proof (`TESTING.md`,
   section 4).
4. **Full checks.** `npm run build`, `npm test`, `isomorph check --app-root . --json`, then a click-through in the dev
   browser as each role `docs/SCOPE.md` names. Record every command and its exact counts in the record. A package
   that writes documents only (package 01) runs what still applies (`isomorph check` on the kit app, the contract's
   fixtures read as valid JSON) and says what it did not run and why.
5. **Self-review.** Claude reviews its own whole diff (Claude Code's `/code-review` where it is available). Its findings
   are recorded as round 0 and decided by the builder like any other.
6. **Codex review rounds,** as `REVIEW_METHOD.md` says. At most three. **Each round after the third only on the owner's
   permission for that one round.**
7. **Corrections.** The builder decides each finding (`REVIEW_METHOD.md`, section 5). Each fix gets its focused test
   and undo proof. A defect in behaviour, security, data, the contract or a test's ability to fail is fixed at once
   and reviewed again. Small wording fixes in records may be gathered and made together once the code is stable. An
   advisory is either fixed or written into `docs/OPEN_ITEMS.md`: it must never just disappear. Run the full checks
   (step 4) after every third round, and always on the final commit.
8. **Close the record.** Final checks on the final commit, with exact counts. `docs/STATUS.md` and `docs/OPEN_ITEMS.md`
   updated. Claude reminds the builder to write their own section.
9. **The owner's check.** The owner audits the package and, where there is a screen, looks at it. Findings go back to
   step 7; a change of code after that is reviewed again (a round past the third only on the owner's permission).
10. **Merge.** Only on the owner's word. Where the repository is on GitHub, the pull request is the very last step:
    raised only on the owner's permission, merged only on the owner's separate, later permission, and no correction
    follows it.

## 3. Ask the owner first, every time

- Approval of the contract, `docs/SCOPE.md` and `docs/DESIGN.md` (package 01), and of any later change to the contract,
  the scope, the brief or these rules.
- Each review round after the third: one permission for one round, never chained and never assumed from an earlier
  one.
- Raising a pull request, and, separately, merging it.
- Switching on external access, making a service credential, entering a key, any call to SurePass or another paid
  service with real numbers, and any production release. Never run `isomorph promote` yourself.
- Any business decision: what the service does, for whom, in what words, what it keeps and for how long.

Technical choices are not the owner's: Claude makes them, explains each in a line or two, and records it under
Decisions in `docs/DESIGN.md` with its reason.

Write every answer the owner gives into `docs/STATUS.md`, "Owner's decisions": the date, the question, and the owner's
own words. Never record an approval the owner did not give in so many words.

A deploy to the **private preview** needs no permission once the brief's steps reach it. Deploy only a clean,
committed folder, and write the commit and the deploy's number in the package record.

## 4. Where these rules override the isomorph skill

The isomorph skill's rules for building, running, deploying, sign-in and secrets apply in full. These five places are
different here:

| The isomorph skill says | Here |
| --- | --- |
| Assume the person does not write code; make every technical choice yourself and never put one to them as a question. | Still make the technical choice yourself, but explain it in a line or two: the builder is learning. Record it in `docs/DESIGN.md`. Every review finding goes to the builder. |
| Show a short summary of `docs/SCOPE.md` and never wait for its approval. | The contract, `docs/SCOPE.md` and `docs/DESIGN.md` wait for the owner's approval in package 01, and any later change to them waits for it again. |
| Commit each turn's changes with a one-line message. | Commit on the package branch. The first line says what changed; add a line on why when it is not obvious. Never commit to `main` directly, except the first commit, which sets the repository up (the brief, section 0). |
| Propose the private preview, then promote once the person has tried it. | The preview, yes, when the brief reaches it. Promotion and production are the owner's alone (section 3). |
| Post to Isomorph's build thread what only Isomorph can answer. | Yes, for platform questions. A question that is the owner's (section 3), or one listed in the brief for the owner to ask, goes to the owner. |

## 5. Git

- `main` holds only work the owner approved.
- A review binds to a commit. Never amend, rebase or force-push a commit that was reviewed: make a new commit.
- Never commit `.isomorph/local/`, `.review/`, a secret, a real PAN, GSTIN or other real identifier, a person's details,
  or a generated report.
- Until Isomorph answers how its GitHub repository and deploys fit together (the brief, section 8, question 3), deploy
  only from a clean, committed folder, and record the commit of every deploy.

## 6. Records

| Record | Holds | Who writes it |
| --- | --- | --- |
| `docs/packages/NN-*.md` | One package: plan, what was built, tests and counts, undo proofs, review rounds, findings and decisions, the builder's own checks, the close | Claude, except the builder's own section |
| `docs/reviews/NN-*/round-N.json` | Codex's reply for one round, unedited, with what it reviewed | `scripts/review/check-result.mjs` |
| `docs/STATUS.md` | Where the work stands, what is next, the owner's decisions | Claude, at each step |
| `docs/OPEN_ITEMS.md` | Advisories, deferred work and open questions, each with where it came from | Claude |
| `docs/SCOPE.md`, `docs/DESIGN.md` | As the isomorph skill says, kept current with the code | Claude |
| `docs/HANDOVER.md` | At the end of the project (the brief, section 7) | Claude |

Never claim a check that was not run: say what was run, on which commit, with its exact counts, and say plainly what
was not run. Never edit a review result. If a record turns out to be wrong after a package is closed, add a dated
correction below it rather than rewriting it.

## 7. How the owner checks the work

The owner reads the records and runs some of the checks again (`audit/DISCIPLINE_AUDIT.md` in `pbl-dev-standards` says
exactly what is checked). A lapse is, for example: a finding with no decision; a count that does not come out the same;
a fix with no test; a test that cannot fail; a record or document out of date; a step that needed the owner's
permission and did not have it; or a "Builder's own checks" section that the builder did not write.

The owner checks closely at first and less as packages pass with no lapse. The aim is that the builder spots what
needs correcting and corrects it, and that the records show it.
