#!/usr/bin/env node
// Enforces the authoring rules in CLAUDE.md that a reader would otherwise have to remember.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const failures = [];
const read = (path) => readFileSync(path, "utf8");
const dirs = (path) =>
  readdirSync(path, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

const readmes = ["README.md", "README.ko.md"].map((path) => [path, read(path)]);
const skills = new Map();

for (const bucket of dirs("skills")) {
  const bucketReadmePath = join("skills", bucket, "README.md");
  const bucketReadme = existsSync(bucketReadmePath) ? read(bucketReadmePath) : null;
  if (bucketReadme === null) failures.push(`${bucketReadmePath} is missing`);

  for (const name of dirs(join("skills", bucket))) {
    const path = join("skills", bucket, name, "SKILL.md");
    if (!existsSync(path)) {
      failures.push(`${path} is missing`);
      continue;
    }
    const text = read(path);
    skills.set(name, text);

    const frontmatter = text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
    const declared = frontmatter.match(/^name:\s*(.+)$/m)?.[1]?.trim();
    if (declared !== name) failures.push(`${path}: frontmatter name is "${declared}", expected "${name}"`);
    if (!/^description:\s*\S/m.test(frontmatter)) failures.push(`${path}: description is missing`);

    if (bucketReadme !== null && !bucketReadme.includes(`(./${name}/SKILL.md)`)) {
      failures.push(`${bucketReadmePath} does not link ${name}`);
    }
    for (const [readmePath, readme] of readmes) {
      if (!readme.includes(`\`${name}\``)) failures.push(`${readmePath} does not list ${name}`);
    }
  }
}

// Installed skills cannot read each other's files, so each pair carries its own copy of the contract.
// The loops pair repeats its contract verbatim; checkpoint abbreviates lets-work, so only the root must match.
const contract = (text) =>
  text
    .match(/^## Personal state[^\n]*\n([\s\S]*?)^\s*- `status`[^\n]*$/m)?.[0]
    .split("\n")
    .filter((line) => !line.startsWith("Same contract as"))
    .join("\n");
const root = (text) => text.match(/^- Root: .*$/m)?.[0];

const compare = (a, b, extract, what) => {
  const [left, right] = [skills.get(a), skills.get(b)].map((text) => text && extract(text));
  if (!left || left !== right) failures.push(`${a} and ${b} disagree on ${what}`);
};
compare("make-loop", "maintain-loop", contract, "the state contract");
compare("lets-work", "checkpoint", root, "the state root");

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}
console.log(`ok: ${skills.size} skills`);
