# Testing

A test is worth having only if it fails when the rule it protects is broken. Do not write tests to raise a count.

## 1. The kinds of test, and where each lives

| Kind | Where | Run by | For |
| --- | --- | --- | --- |
| Unit tests | `unit/*.test.ts` (Vitest) | `npm test` | Pure rules: number formats and the check character, reading a provider's replies, the reply-to-outcome table, masking, India's day |
| Journeys | `tests/*.mjs` | `isomorph check` | Each action end to end on a real local database: success, every refusal, permissions, replays, limits, two requests at once |
| The check | | `isomorph check --app-root . --json` | Types, build, schema, row-level security, journeys, coverage |
| Click-through | the dev browser | by hand, or a subagent | Every flow in `docs/SCOPE.md`, as each role, with no data, with data and after a reload |
| From outside | `scripts/*.mjs` | `node scripts/<name>.mjs` against the preview | Calls with a service credential, as another system makes them |

Keep unit tests out of `tests/`, which `isomorph check` runs as journeys, and out of `actions/`, which is deployed. Add
`unit` to `tsconfig.json`'s `include` so the build type-checks the tests too.

## 2. What every action is tested for

- success, and the exact shape of its answer;
- every refusal: a missing field, a wrong type, an unknown field, each malformed value;
- a caller not allowed: as `identity: "second-user"` in a journey, refused, for every action that is not public;
- a record not found, and a caller asking for another caller's record;
- the same request key with the same request (the first answer, replayed, nothing new written) and with a different
  request (refused);
- two identical requests at the same moment, and two requests at a limit: exactly one passes;
- that no answer or error carries a key, a number it should not, a name, a reply body or an internal message.

## 3. The contract's fixtures

Each example request and answer under `docs/contracts/fixtures/` is checked by a test against what the code really
does, so the contract and the code cannot drift apart.

## 4. Undo proofs

For every fix and every new rule:

1. Break the rule **in the code**, not in the test.
2. Run the test that protects it and see it fail, with a message that names the rule.
3. Put the code back and see the test pass.

Record each in the package record: the test, what was broken, the line it failed with, and that it passed again. A
test that does not fail when its rule is broken is a defect in the test.

## 5. No paid calls

- Tests, journeys, CI, `isomorph check` and review rounds **never** call SurePass or any other paid service.
- Provider replies are recorded examples with invented values, read by unit tests.
- Actions are tested on the practice register.
- The adapter calls the live service only when its key is set, and no test sets it.

## 6. Today's date in a test

A test whose rule depends on the day fixes the day through the one India's-day helper (`CODING_STANDARDS.md`, section
7). Never read the clock when a test file loads: a run that crosses midnight in India would expect yesterday.

## 7. Reporting

- Report each check as: the command, the commit it ran on, and its exact result. For example: "`npm test` on `3f2a9c1`:
  42 passed, 0 failed, 0 skipped". "Tests pass" without counts is not evidence.
- A check that was not run is reported as not run, with why.
- Never weaken, skip or delete a test to make work pass. A test that is wrong is corrected, and the record says why.
- A test that passes sometimes and fails sometimes is diagnosed and fixed, never re-run until it goes green.

## 8. When to run what

| When | Run |
| --- | --- |
| While building, and after each review round's fixes | The focused tests for what changed, and their undo proofs |
| Before the first Codex round, after every third round, and always on the final commit before the owner's check | The full set: `npm run build`, `npm test`, `isomorph check`, the click-through |
| When a fix touches something several actions share (a helper in `actions/lib/`, a migration, the caller check) | The full set, at once |
| On the preview, before handover | The outside calls in `scripts/`, with their counts |
