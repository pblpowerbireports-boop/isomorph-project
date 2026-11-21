#!/usr/bin/env node
// Builds the packet for one Codex review round, as docs/rules/REVIEW_METHOD.md describes.
//
//   node scripts/review/build-packet.mjs --package <pkg> --round <n> [--base <commit>] [--include <path>]...
//
// The packet is built from the committed tree only (never the working folder), so what Codex reviews is exactly one
// commit. It is written to .review/<pkg>/round-<n>/, which Git ignores.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// The reviewer and its settings. They change only on the owner's word.
const REVIEW_MODEL = "gpt-5.6-sol";
const REVIEW_EFFORT = "high";

// Codex refuses more than 1,048,576 characters of input. Keep a margin.
const MAX_CHARS = 950_000;

// Carried whole in every packet when they exist at the reviewed commit: the authority for what the code must do.
const ALWAYS_WHOLE = [
  "docs/brief/BUILD_BRIEF.md",
  "docs/SCOPE.md",
  "docs/DESIGN.md",
  "docs/STATUS.md",
  "docs/OPEN_ITEMS.md",
  "docs/rules/CODING_STANDARDS.md",
  "docs/rules/TESTING.md",
];
const ALWAYS_WHOLE_FOLDERS = ["docs/contracts/"];

// Never carried: generated, or earlier rounds' results.
const NEVER = [/^package-lock\.json$/, /^docs\/reviews\//, /^\.isomorph\/checks\//, /^\.isomorph\/check-report\.json$/];

const here = dirname(fileURLToPath(import.meta.url));

function fail(message) {
  console.error(`build-packet: ${message}`);
  process.exit(1);
}

function git(args, options = {}) {
  return execFileSync("git", args, { encoding: options.buffer ? undefined : "utf8", maxBuffer: 256 * 1024 * 1024 });
}

function parseArgs(argv) {
  const args = { include: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const name = argv[i];
    const value = argv[i + 1];
    if (!["--package", "--round", "--base", "--include"].includes(name)) fail(`unknown argument ${name}`);
    if (value === undefined || value.startsWith("--")) fail(`${name} needs a value`);
    if (name === "--include") args.include.push(value);
    else args[name.slice(2)] = value;
    i += 1;
  }
  if (!args.package || !/^[0-9]{2}[a-z]?-[a-z0-9-]+$/.test(args.package)) {
    fail("--package must be the package's name, for example 02-practice-register");
  }
  if (!args.round || !/^[0-9]+[a-z]?$/.test(args.round)) fail("--round must be a number, for example 1 or 2b");
  return args;
}

function isNever(path) {
  return NEVER.some((pattern) => pattern.test(path));
}

function treePaths(commit) {
  return new Set(git(["ls-tree", "-r", "--name-only", "-z", commit]).split("\0").filter(Boolean));
}

function wholeText(commit, path) {
  const bytes = git(["show", `${commit}:${path}`], { buffer: true });
  if (bytes.includes(0)) return null; // binary
  const text = bytes.toString("utf8");
  const lines = text.split("\n").map((line) => line.replace(/\r$/, ""));
  if (lines[lines.length - 1] === "") lines.pop();
  const width = String(lines.length).length;
  const numbered = lines.map((line, index) => `${String(index + 1).padStart(width)} | ${line}`).join("\n");
  return { lines: lines.length, numbered };
}

const args = parseArgs(process.argv.slice(2));
const root = git(["rev-parse", "--show-toplevel"]).trim();
process.chdir(root);

try {
  git(["check-ignore", "-q", ".review/x"]);
} catch {
  fail("add .review/ to .gitignore first: packets are never committed");
}
const dirty = git(["status", "--porcelain"]).trim();
if (dirty) fail(`the folder is not clean; commit first. A round reviews one commit.\n${dirty}`);

const head = git(["rev-parse", "HEAD"]).trim();
const tree = git(["rev-parse", "HEAD^{tree}"]).trim();
let base = args.base;
if (!base) {
  try {
    base = git(["merge-base", "HEAD", "main"]).trim();
  } catch {
    fail("no --base given and no main branch to start from; give --base <commit>");
  }
  if (base === head) fail("HEAD is where the branch left main, so there is nothing to review; give --base <commit>");
}
try {
  base = git(["rev-parse", "--verify", `${base}^{commit}`]).trim();
} catch {
  fail(`--base ${args.base} is not a commit`);
}
if (base === head) fail("the base and the reviewed commit are the same: nothing to review");

const roundDir = join(".review", args.package, `round-${args.round}`);
const focusPath = join(roundDir, "focus.md");
if (!existsSync(focusPath)) fail(`write the round's focus first, in ${focusPath} (REVIEW_METHOD.md, section 3)`);
const focus = readFileSync(focusPath, "utf8").trim();
if (focus.length < 200) fail(`${focusPath} is too short to guide a review; say what to check specifically`);
if (existsSync(join("docs", "reviews", args.package, `round-${args.round}.json`))) {
  fail(`round ${args.round} of ${args.package} already has a recorded result; a new round needs a new number`);
}

const present = treePaths(head);
const changes = git(["diff", "--name-status", "-M", "-z", base, head]).split("\0").filter(Boolean);
const changed = [];
for (let i = 0; i < changes.length; ) {
  const status = changes[i];
  if (status.startsWith("R") || status.startsWith("C")) {
    changed.push({ status: status[0], from: changes[i + 1], path: changes[i + 2] });
    i += 3;
  } else {
    changed.push({ status: status[0], path: changes[i + 1] });
    i += 2;
  }
}

const recordPath = `docs/packages/${args.package}.md`;
if (!present.has(recordPath)) fail(`the package record ${recordPath} is not in the reviewed commit`);

// Whole files: the package record, every file the change added or modified, the authority, and --include.
const whole = new Set([recordPath]);
for (const change of changed) if (change.status !== "D" && !isNever(change.path)) whole.add(change.path);
for (const path of ALWAYS_WHOLE) if (present.has(path)) whole.add(path);
for (const path of present) if (ALWAYS_WHOLE_FOLDERS.some((folder) => path.startsWith(folder))) whole.add(path);
for (const wanted of args.include) {
  const clean = wanted.replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/$/, "");
  const matches = [...present].filter((path) => path === clean || path.startsWith(`${clean}/`));
  if (matches.length === 0) fail(`--include ${wanted} is not in the reviewed commit`);
  for (const path of matches) if (!isNever(path)) whole.add(path);
}

// The diff, of files the change modified, renamed or deleted. Added files are carried whole instead.
const diff = git([
  "diff", "-M", "--unified=10", "--diff-filter=MRDT", base, head, "--", ".",
  ":(exclude)package-lock.json", ":(exclude)docs/reviews/**",
]);

const sections = [];
sections.push(
  [
    "=== WHAT WAS REVIEWED ===",
    `package: ${args.package}`,
    `round: ${args.round}`,
    `base commit: ${base}`,
    `reviewed commit: ${head}`,
    `reviewed tree: ${tree}`,
  ].join("\n"),
);
sections.push(`=== THE ROUND'S FOCUS ===\n${focus}`);
sections.push(
  `=== CHANGED FILES (base to reviewed commit) ===\n${changed
    .map((c) => {
      const note = isNever(c.path) ? " (not carried)" : c.status === "A" ? " (added, so not in the diff)" : "";
      return `${c.status} ${c.from ? `${c.from} -> ` : ""}${c.path}${note}`;
    })
    .join("\n")}`,
);
sections.push(`=== DIFF OF MODIFIED, RENAMED AND DELETED FILES ===\n${diff.trim() || "(none)"}`);

const skipped = [];
const sizes = [];
for (const path of [...whole].sort()) {
  const text = wholeText(head, path);
  if (text === null) {
    skipped.push(path);
    continue;
  }
  const section = `=== FILE: ${path} (whole text at the reviewed commit, ${text.lines} lines) ===\n${text.numbered}`;
  sizes.push([section.length, path]);
  sections.push(section);
}
if (skipped.length) sections.push(`=== BINARY FILES NOT CARRIED ===\n${skipped.join("\n")}`);

const packet = `${sections.join("\n\n")}\n`;
const sha256 = createHash("sha256").update(packet, "utf8").digest("hex");
const instructions = readFileSync(join(here, "instructions.md"), "utf8").replaceAll("{PACKET_SHA256}", sha256);
const stdin = `${instructions.trim()}\n\nPACKET SHA-256: ${sha256}\n\n${packet}`;

if (stdin.length > MAX_CHARS) {
  const largest = sizes.sort((a, b) => b[0] - a[0]).slice(0, 8).map(([n, p]) => `  ${n} characters: ${p}`).join("\n");
  fail(
    `the packet is ${stdin.length} characters, over the ${MAX_CHARS} limit. Never cut code to fit; leave out long ` +
      `summary documents first, or split the package. Largest files:\n${largest}`,
  );
}

mkdirSync(join(roundDir, "empty"), { recursive: true });
writeFileSync(join(roundDir, "packet.md"), packet);
writeFileSync(join(roundDir, "stdin.txt"), stdin);
// Codex is given whole paths, so it finds them whatever folder it starts in; the redirections are from this folder.
const slash = (path) => path.replace(/\\/g, "/");
const dir = slash(roundDir);
const absolute = (path) => slash(join(root, path));
const command =
  `codex exec -m ${REVIEW_MODEL} -c model_reasoning_effort=${REVIEW_EFFORT} -c web_search=disabled ` +
  `--ignore-user-config --ignore-rules --ephemeral --skip-git-repo-check --sandbox read-only --strict-config ` +
  `--output-schema "${slash(join(here, "schema.json"))}" -o "${absolute(join(roundDir, "result.json"))}" --json ` +
  `-C "${absolute(join(roundDir, "empty"))}" - < "${dir}/stdin.txt" > "${dir}/events.jsonl"`;
const meta = {
  package: args.package,
  round: args.round,
  base_commit: base,
  reviewed_commit: head,
  reviewed_tree: tree,
  packet_sha256: sha256,
  packet_characters: stdin.length,
  files_whole: [...whole].sort().filter((p) => !skipped.includes(p)),
  model: REVIEW_MODEL,
  reasoning_effort: REVIEW_EFFORT,
  built_at: new Date().toISOString(),
  command,
};
writeFileSync(join(roundDir, "meta.json"), `${JSON.stringify(meta, null, 2)}\n`);

console.log(`Packet for ${args.package}, round ${args.round}: ${stdin.length} characters, SHA-256 ${sha256}`);
console.log(`Reviewed commit ${head} against base ${base}; ${meta.files_whole.length} files carried whole.`);
console.log("\nRun Codex from Bash (Git Bash on Windows), in this folder:\n");
console.log(command);
console.log(`\nThen: node scripts/review/check-result.mjs --package ${args.package} --round ${args.round}`);
