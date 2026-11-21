# Coding standards

For all code in this repository: actions, jobs, migrations, the page, tests and scripts. They are PBL's standards,
made to fit an Isomorph app in TypeScript.

## 1. Design principles

- **DRY first, then KISS, YAGNI and SOLID**, as far as they do not conflict. Before writing something, look for the
  existing helper or pattern and reuse it. Extract a shared one when a second copy would appear.
- Build what the brief asks for, not what it might one day need.
- Change only what the package is for. No refactoring of unrelated code, no renaming of stable names, no formatting
  churn.

## 2. The contract

- Field names, outcomes, reasons and status codes are exactly as the contract says. Nothing the contract does not name
  crosses it, and no provider's own field name crosses it.
- The contract changes only by a new version the owner approves. A change to the contract changes its fixtures in the
  same commit, and a test checks each fixture against the code's real answer.

## 3. Actions and jobs

- **Each action checks its own input first**: every required field present, every type right, every unknown field
  refused, every value in its allowed form. Isomorph checks `expose.input` only for outside callers, so a builder's call
  from inside the app is not checked unless the action does it.
- **Who may call is checked in the action**, never only on the page. The page hiding a button is not security.
- An error answer follows the contract's shape and says plainly what was wrong. It never carries a stack trace, a
  database message, a key, a number or a provider's reply.
- Keep actions thin: the rules live in `actions/lib/`, in modules named for what they do. Rules that need no platform
  (number formats, the check character, reading a provider's reply, outcomes, masking, India's day) are pure functions,
  so unit tests reach them directly.
- Split a file that grows past about 400 lines along the concerns it already has.

## 4. Data

- **Every table change is a migration**, `migrations/NNNN_name.sql`. A migration that has been deployed never changes;
  correct it with a new one.
- Every table has row-level security on, with its policy, as the isomorph skill requires.
- **Rules about many rows are held by the database**, not only by code: a unique constraint for "one record per request
  id", a row lock (`FOR UPDATE` inside a transaction, which needs an UPDATE policy on the table) for a daily limit.
  Two requests arriving together must not both pass.
- Keep what the brief says to keep, no more. Never keep a provider's raw reply.

## 5. Secrets and personal data

- A key or secret appears in code only by its name. Its value is typed in Isomorph's console by the person who holds it.
- Never read, print or copy `.isomorph/local/secrets.env`, `.isomorph/local/hooks.json` or the Isomorph sign-in files in
  your home folder.
- **No real PAN, GSTIN or other real identifier, and no real person's or company's details, in any file**: code, test,
  fixture, record, commit message or review packet. Use the practice register's invented numbers.
- A log line says which check ran, its outcome and how long it took. Never a number, a name or a reply body.
- On the page, a number is masked except for its last 4 characters.

## 6. Calls to an outside service

- One adapter per provider, behind one interface, so a provider can be added or changed without touching the actions.
- Every call has a timeout. Never retry in a loop; a failed call is an outcome (`NO_ANSWER`), not an error.
- Every possible reply maps to exactly one outcome, by a table the tests cover row by row.
- Tests never reach the provider (`TESTING.md`, section 5).

## 7. Time

- The business day is India's (Asia/Kolkata). One helper gives India's date for a moment and "today in India"; every
  rule that depends on the day uses it, so a test can fix the day.
- Store and send moments as ISO text in UTC, with the zone.

## 8. TypeScript

- `strict` stays on. No `any` except where unknown input is first read, and narrow it at once.
- No `!` or type casts to silence the compiler. A `switch` over outcomes is exhaustive, so a new outcome fails to
  compile until every place handles it.
- Comments only where the reason is not obvious: a rule from the brief or the contract, or a platform behaviour and
  the lesson behind it.

## 9. Dependencies

No new library without a line under Decisions in `docs/DESIGN.md` saying why the platform or the existing code cannot do
it. The test runner (Vitest) is already chosen.
