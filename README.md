# Isomorph app

The first page — a notes list, a private-files card and the builder's Setup card — is a placeholder the agent replaces with the app you asked for.

Created by `isomorph init`: a Vite + React app that runs on Isomorph. Sign-in, data, files and company systems come from the platform through `@isomorph.ai/app-sdk`, so the app has no backend of its own.

## Three commands

- `isomorph dev --app-root . --detach --json` — starts the app on this machine with a local database, file store and gateway; open the printed link.
- `isomorph check --app-root . --json` — the same gates the deployment pipeline runs (types, build, schema, journeys).
- `isomorph deploy --app-root . --change "<what this version changes for users>" --json` — deploys a private preview for the people named in `.isomorph/app.json`; `isomorph promote` makes it live for everyone once they have tried it.

## Where the rules are

The kit's rules are in the `isomorph` skill that `isomorph agent-setup` installs for Claude Code, Codex and Cursor (`~/.claude/skills/isomorph/`, `~/.codex/skills/isomorph/`, `~/.cursor/skills/isomorph/`): `core.md` (identity, data, files, realtime, commands, error codes), `integrations.md` (Slack, Gmail, warehouse), `ai.md`, `browser.md` and `jobs.md`. The managed block in CLAUDE.md / AGENTS.md points there.

## Look and feel

`src/styles.css` is the whole look: plain CSS tokens, a top bar and page, cards, stats, tables, forms, light and dark, no UI library. `design.md` in the skill says how screens use it.

`.isomorph/checks/` is regenerated on each check and gitignored — put your own checks in `tests/<name>.mjs`. `.isomorph/integrations.json` is derived by `isomorph check` from the app's `isomorph.integrations.execute` calls and committed, never edited. `.isomorph/app.json` holds the app's name and description; `isomorph share` sets who can open it.
