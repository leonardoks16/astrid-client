import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();

function exec(command, args = []) {
  try {
    return execFileSync(command, args, {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    return "";
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, filePath), "utf8"));
}

function writeOutput(data) {
  const outputPath = process.env.GITHUB_OUTPUT;

  for (const [key, value] of Object.entries(data)) {
    console.log(`${key}=${value}`);
  }

  if (!outputPath) return;

  const lines = Object.entries(data).map(([key, value]) => {
    const safe = String(value).replaceAll("\n", " ");
    return `${key}=${safe}`;
  });

  fs.appendFileSync(outputPath, `${lines.join("\n")}\n`);
}

function appendSummary(markdown) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) return;
  fs.appendFileSync(summaryPath, `${markdown}\n`);
}

function isCountableSourceFile(file) {
  const normalized = file.replaceAll("\\", "/");

  if (
    normalized.startsWith("node_modules/") ||
    normalized.startsWith("dist/") ||
    normalized.startsWith("build/") ||
    normalized.startsWith("coverage/") ||
    normalized.startsWith(".git/") ||
    normalized.startsWith(".next/") ||
    normalized.startsWith(".nuxt/") ||
    normalized.endsWith(".lock")
  ) {
    return false;
  }

  const ext = path.extname(normalized).toLowerCase();

  return [
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".mjs",
    ".cjs",
    ".json",
    ".md",
    ".yml",
    ".yaml",
    ".css",
    ".scss",
    ".html",
    ".vue",
    ".svelte",
  ].includes(ext);
}

function countLines(file) {
  const fullPath = path.join(ROOT, file);
  if (!fs.existsSync(fullPath)) return 0;

  try {
    const content = fs.readFileSync(fullPath, "utf8");
    if (!content) return 0;
    return content.split(/\r?\n/).length;
  } catch {
    return 0;
  }
}

function getLatestSemverTag() {
  return exec("git", ["describe", "--tags", "--match", "v[0-9]*", "--abbrev=0"]);
}

function getCommitMessages(baseTag) {
  if (baseTag) {
    return exec("git", ["log", `${baseTag}..HEAD`, "--pretty=%B"]);
  }

  return exec("git", ["log", "--pretty=%B"]);
}

function getDiffNameOnly(baseTag) {
  if (baseTag) {
    return exec("git", ["diff", "--name-only", `${baseTag}...HEAD`]);
  }

  const parent = exec("git", ["rev-parse", "HEAD~1"]);

  if (parent) {
    return exec("git", ["diff", "--name-only", `${parent}`, "HEAD"]);
  }

  return exec("git", ["diff-tree", "--no-commit-id", "--name-only", "--root", "-r", "HEAD"]);
}

function getDiffNumstat(baseTag) {
  if (baseTag) {
    return exec("git", ["diff", "--numstat", `${baseTag}...HEAD`]);
  }

  const parent = exec("git", ["rev-parse", "HEAD~1"]);

  if (parent) {
    return exec("git", ["diff", "--numstat", `${parent}`, "HEAD"]);
  }

  return exec("git", ["diff-tree", "--numstat", "--root", "-r", "HEAD"]);
}

function parseNumstat(numstat) {
  let added = 0;
  let deleted = 0;
  let files = 0;

  for (const line of numstat.split("\n").filter(Boolean)) {
    const [rawAdded, rawDeleted] = line.split(/\s+/);

    if (rawAdded !== "-") added += Number(rawAdded || 0);
    if (rawDeleted !== "-") deleted += Number(rawDeleted || 0);

    files += 1;
  }

  return {
    added,
    deleted,
    modified: added + deleted,
    files,
  };
}

function getTrackedTotalLines() {
  const trackedFiles = exec("git", ["ls-files"])
    .split("\n")
    .filter(Boolean)
    .filter(isCountableSourceFile);

  return trackedFiles.reduce((sum, file) => sum + countLines(file), 0);
}

function getPackageAtRef(ref) {
  if (!ref) return null;

  const raw = exec("git", ["show", `${ref}:package.json`]);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function hasPublicPackageContractChanged(previousPkg, currentPkg) {
  if (!previousPkg) return false;

  const publicContractKeys = [
    "name",
    "type",
    "main",
    "module",
    "types",
    "exports",
    "bin",
    "files",
    "engines",
    "peerDependencies",
  ];

  return publicContractKeys.some((key) => {
    return JSON.stringify(previousPkg[key] ?? null) !== JSON.stringify(currentPkg[key] ?? null);
  });
}

function resolveBranchStrategy(branch) {
  if (branch === "main" || branch === "master") {
    return {
      npmTag: "latest",
      preid: "",
      prerelease: false,
    };
  }

  if (branch === "dev" || branch === "develop") {
    return {
      npmTag: "beta",
      preid: "beta",
      prerelease: true,
    };
  }

  return {
    npmTag: "next",
    preid: "next",
    prerelease: true,
  };
}

function resolveBump({ commitMessages, changedFiles, changeRatio, publicContractChanged }) {
  const hasBreakingCommit =
    /BREAKING CHANGE:/i.test(commitMessages) || /^[a-z]+(?:\([^)]+\))?!:/im.test(commitMessages);

  if (hasBreakingCommit) {
    return {
      bump: "major",
      reason: "breaking commit detected",
    };
  }

  const hasFeatureCommit = /^feat(?:\([^)]+\))?:/im.test(commitMessages);

  if (hasFeatureCommit) {
    return {
      bump: "minor",
      reason: "feature commit detected",
    };
  }

  if (publicContractChanged) {
    return {
      bump: "minor",
      reason: "public package contract changed",
    };
  }

  if (changeRatio >= 0.15) {
    return {
      bump: "minor",
      reason: `large package delta: ${(changeRatio * 100).toFixed(2)}%`,
    };
  }

  const sourceChanged = changedFiles.some((file) => {
    return (
      file.startsWith("src/") ||
      file.startsWith("lib/") ||
      file.startsWith("bin/") ||
      file === "package.json" ||
      file === "package-lock.json" ||
      file === "npm-shrinkwrap.json" ||
      file === "README.md" ||
      file === "LICENSE"
    );
  });

  if (!sourceChanged) {
    return {
      bump: "none",
      reason: "no releasable package files changed",
    };
  }

  return {
    bump: "patch",
    reason: "default patch release",
  };
}

function resolveNpmVersionArg({ bump, prerelease, currentVersion }) {
  if (bump === "none") return "none";

  if (!prerelease) return bump;

  const alreadyPrerelease = currentVersion.includes("-");

  if (alreadyPrerelease) return "prerelease";

  if (bump === "major") return "premajor";
  if (bump === "minor") return "preminor";

  return "prepatch";
}

const pkg = readJson("package.json");
const currentVersion = pkg.version;
const branch =
  process.env.GITHUB_REF_NAME || exec("git", ["branch", "--show-current"]) || "unknown";

const latestTag = getLatestSemverTag();
const changedFiles = getDiffNameOnly(latestTag).split("\n").filter(Boolean);
const numstat = parseNumstat(getDiffNumstat(latestTag));
const totalLines = getTrackedTotalLines();
const changeRatio = totalLines > 0 ? numstat.modified / totalLines : 0;
const commitMessages = getCommitMessages(latestTag);

const previousPkg = getPackageAtRef(latestTag);
const publicContractChanged = hasPublicPackageContractChanged(previousPkg, pkg);

const branchStrategy = resolveBranchStrategy(branch);

const bumpResult = resolveBump({
  commitMessages,
  changedFiles,
  changeRatio,
  publicContractChanged,
});

const npmVersionArg = resolveNpmVersionArg({
  bump: bumpResult.bump,
  prerelease: branchStrategy.prerelease,
  currentVersion,
});

const releaseNeeded = bumpResult.bump !== "none";

const output = {
  release_needed: String(releaseNeeded),
  branch,
  current_version: currentVersion,
  latest_tag: latestTag || "none",
  bump: bumpResult.bump,
  npm_version_arg: npmVersionArg,
  npm_tag: branchStrategy.npmTag,
  preid: branchStrategy.preid,
  reason: bumpResult.reason,
  changed_files: String(changedFiles.length),
  added_lines: String(numstat.added),
  deleted_lines: String(numstat.deleted),
  modified_lines: String(numstat.modified),
  total_lines: String(totalLines),
  change_ratio: changeRatio.toFixed(6),
  change_percent: `${(changeRatio * 100).toFixed(2)}%`,
  public_contract_changed: String(publicContractChanged),
};

writeOutput(output);

appendSummary(`
## Release decision

| Field | Value |
|---|---:|
| Branch | \`${output.branch}\` |
| Current version | \`${output.current_version}\` |
| Latest tag | \`${output.latest_tag}\` |
| Release needed | \`${output.release_needed}\` |
| Bump | \`${output.bump}\` |
| npm version arg | \`${output.npm_version_arg}\` |
| npm dist-tag | \`${output.npm_tag}\` |
| Reason | ${output.reason} |
| Changed files | ${output.changed_files} |
| Added lines | ${output.added_lines} |
| Deleted lines | ${output.deleted_lines} |
| Modified lines | ${output.modified_lines} |
| Total tracked lines | ${output.total_lines} |
| Change percent | ${output.change_percent} |
| Public contract changed | \`${output.public_contract_changed}\` |
`);
