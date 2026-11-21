<!-- isomorph:kit:start -->
## Isomorph development kit

This app runs on Isomorph: use the `isomorph` skill (Claude Code `~/.claude/skills/isomorph/`, Codex `~/.codex/skills/isomorph/`, Cursor `~/.cursor/skills/isomorph/`; if it is missing, run `npx -y @isomorph.ai/cli agent-setup`). Read `core.md` there before the first edit, and search the skill before guessing or asking how Isomorph works; keep `docs/SCOPE.md` and `docs/DESIGN.md` current.

Commands: `isomorph dev --app-root . --detach --json`, `isomorph check --app-root . --json`, `isomorph deploy --app-root . --change "<what changed>" --json`.
<!-- isomorph:kit:end -->


<!-- pbl:rules:start -->
## PBL working rules

This app is built by the PBL team under PBL's working rules (from `pbl-transport/pbl-dev-standards`). The person you
work with is a developer learning this method. Explain what you do and why in plain words, put every review finding to
them with your recommendation, and record their decision in their words. Never decide a finding for them, and never
write the "Builder's own checks" section of a package record.

The project's brief is the authority for what is built; these rules are the authority for how. Where these rules and
the isomorph skill differ, these rules win: `docs/rules/WORKING_METHOD.md`, section 4, lists each place. Change none of
these files, and not the brief, without the owner's approval.

@docs/brief/BUILD_BRIEF.md
@docs/rules/WORKING_METHOD.md
@docs/rules/CODING_STANDARDS.md
@docs/rules/TESTING.md
@docs/rules/REVIEW_METHOD.md
@docs/STATUS.md
@docs/OPEN_ITEMS.md
<!-- pbl:rules:end -->
