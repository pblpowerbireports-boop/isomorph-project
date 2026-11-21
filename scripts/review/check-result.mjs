#!/usr/bin/env node
// Checks Codex's reply for one review round and records it, as docs/rules/REVIEW_METHOD.md describes.
//
//   node scripts/review/check-result.mjs --package <pkg> --round <n>
//
// Fails closed: a reply that is not valid JSON, has an unknown state or severity, is missing a field, names another
// packet, or says ACCEPTED while carrying a blocking or material finding is recorded as MODEL_ESCALATION_REQUIRED.
// The reply is kept exactly as Codex wrote it.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const STATES = ["ACCEPTED", "CORRECTION_REQUIRED", "MODEL_ESCALATION_REQUIRED", "HUMAN_DECISION_REQUIRED"];
const SEVERITIES = ["blocking", "material", "advisory"];
const FINDING_FIELDS = [
  "severity",
  "affected_path_or_component",
  "violated_invariant",
  "trigger",
  "consequence",
  "recommended_correction",
];

function fail(message) {
  console.error(`check-result: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    const name = argv[i];
    const value = argv[i + 1];
    if (!["--package", "--round"].includes(name)) fail(`unknown argument ${name}`);
    if (value === undefined || value.startsWith("--")) fail(`${name} needs a value`);
    args[name.slice(2)] = value;
  }
  if (!args.package || !args.round) fail("give --package <pkg> --round <n>");
  return args;
}

// Returns the reasons the reply cannot be trusted; an empty list means it is well formed.
export function problemsWith(reply, expectedSha256) {
  if (reply === null || typeof reply !== "object" || Array.isArray(reply)) return ["the reply is not a JSON object"];
  const problems = [];
  const known = ["review_state", "packet_sha256", "findings", "residual_uncertainty"];
  for (const key of Object.keys(reply)) if (!known.includes(key)) problems.push(`unknown field ${key}`);
  if (!STATES.includes(reply.review_state)) problems.push(`unknown review_state ${JSON.stringify(reply.review_state)}`);
  if (reply.packet_sha256 !== expectedSha256) {
    problems.push(`packet_sha256 ${JSON.stringify(reply.packet_sha256)} is not the packet sent (${expectedSha256})`);
  }
  if (typeof reply.residual_uncertainty !== "string") problems.push("residual_uncertainty is missing");
  if (!Array.isArray(reply.findings)) {
    problems.push("findings is not a list");
    return problems;
  }
  reply.findings.forEach((finding, index) => {
    if (finding === null || typeof finding !== "object" || Array.isArray(finding)) {
      problems.push(`finding ${index + 1} is not an object`);
      return;
    }
    for (const field of FINDING_FIELDS) {
      if (typeof finding[field] !== "string" || finding[field].trim() === "") {
        problems.push(`finding ${index + 1} has no ${field}`);
      }
    }
    for (const key of Object.keys(finding)) {
      if (!FINDING_FIELDS.includes(key)) problems.push(`finding ${index + 1} has an unknown field ${key}`);
    }
    if (!SEVERITIES.includes(finding.severity)) {
      problems.push(`finding ${index + 1} has an unknown severity ${JSON.stringify(finding.severity)}`);
    }
  });
  const serious = reply.findings.filter((f) => f && (f.severity === "blocking" || f.severity === "material"));
  if (reply.review_state === "ACCEPTED" && serious.length > 0) {
    problems.push("the reply says ACCEPTED but carries a blocking or material finding");
  }
  return problems;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
  process.chdir(root);

  const roundDir = join(".review", args.package, `round-${args.round}`);
  const metaPath = join(roundDir, "meta.json");
  const resultPath = join(roundDir, "result.json");
  if (!existsSync(metaPath)) fail(`no packet was built for this round (${metaPath} is missing)`);
  if (!existsSync(resultPath)) fail(`Codex wrote no result (${resultPath} is missing); see ${roundDir}/events.jsonl`);
  const meta = JSON.parse(readFileSync(metaPath, "utf8"));
  const raw = readFileSync(resultPath, "utf8");
  const focus = readFileSync(join(roundDir, "focus.md"), "utf8");

  let reply = null;
  let problems;
  try {
    reply = JSON.parse(raw);
    problems = problemsWith(reply, meta.packet_sha256);
  } catch (error) {
    problems = [`the reply is not valid JSON (${error.message})`];
  }
  const state = problems.length === 0 ? reply.review_state : "MODEL_ESCALATION_REQUIRED";

  const outDir = join("docs", "reviews", args.package);
  const outPath = join(outDir, `round-${args.round}.json`);
  if (existsSync(outPath)) fail(`${outPath} already exists; a recorded result is never overwritten`);
  mkdirSync(outDir, { recursive: true });
  const record = {
    package: meta.package,
    round: meta.round,
    base_commit: meta.base_commit,
    reviewed_commit: meta.reviewed_commit,
    reviewed_tree: meta.reviewed_tree,
    packet_sha256: meta.packet_sha256,
    packet_characters: meta.packet_characters,
    model: meta.model,
    reasoning_effort: meta.reasoning_effort,
    built_at: meta.built_at,
    checked_at: new Date().toISOString(),
    state,
    check: problems.length === 0 ? "well formed and names the packet sent" : problems,
    focus,
    files_whole: meta.files_whole,
    reply_as_written: raw,
  };
  writeFileSync(outPath, `${JSON.stringify(record, null, 2)}\n`);

  console.log(`${args.package}, round ${args.round}: ${state}`);
  if (problems.length) {
    console.log("The reply cannot be trusted, so it counts as MODEL_ESCALATION_REQUIRED:");
    for (const problem of problems) console.log(`  - ${problem}`);
  } else {
    const count = (s) => reply.findings.filter((f) => f.severity === s).length;
    console.log(`Findings: ${count("blocking")} blocking, ${count("material")} material, ${count("advisory")} advisory.`);
    reply.findings.forEach((f, index) => {
      console.log(`\nR${args.round}.${index + 1} [${f.severity}] ${f.affected_path_or_component}`);
      console.log(`  Rule broken: ${f.violated_invariant}`);
      console.log(`  When: ${f.trigger}`);
      console.log(`  Then: ${f.consequence}`);
      console.log(`  Correction: ${f.recommended_correction}`);
    });
    console.log(`\nResidual uncertainty: ${reply.residual_uncertainty}`);
  }
  console.log(`\nRecorded in ${outPath.replace(/\\/g, "/")}. Put every finding in the package record with the builder's decision.`);
}

if (process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("scripts/review/check-result.mjs")) main();
