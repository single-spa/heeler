import fs from "node:fs";
import path from "path";
import simpleGit from "simple-git";
import semver from "semver";

export function addToChangelog(answers) {
  const packageJson = fs.readFileSync(
    path.resolve(process.cwd(), "package.json"),
    "utf-8",
  );
  const changelogPath = path.resolve(process.cwd(), "CHANGELOG.md");
  if (!fs.existsSync(changelogPath)) {
    fs.writeFileSync(changelogPath, "", "utf-8");
  }

  const changelog = fs.readFileSync(changelogPath, "utf-8");

  const startStr = "# Unpublished\n\n";
  let sliceIndex;

  if (changelog.startsWith(startStr)) {
    sliceIndex = startStr.length;
  } else {
    sliceIndex = 0;
  }

  const newEntry = `- (${answers.changetype}): COMMITMSG\n`;

  const completeFile = startStr + newEntry + changelog.slice(sliceIndex);

  fs.writeFileSync("CHANGELOG.md", completeFile, "utf-8");

  return simpleGit().add("CHANGELOG.md");
}

export async function assertChangelogMostRecentCommit() {
  const git = simpleGit();
  const mostRecentLog = await git.log({ maxCount: 1 });

  const blame = await git.raw(["blame", "CHANGELOG.md"]);
  const blameLines = blame.split("\n");
  if (!blameLines[0].endsWith("# Unpublished")) {
    throw Error(`heeler: CHANGELOG.md doesn't have any unpublished changelogs`);
  }

  const firstChangelogEntry = blameLines.slice(1).find((line) => {
    return /.+ \- \(.+\):/g.test(line);
  });

  const blameHash = firstChangelogEntry
    .slice(0, firstChangelogEntry.indexOf(" "))
    .replace(/^\^/, "");
  if (!mostRecentLog.latest.hash.startsWith(blameHash)) {
    throw Error(
      `heeler: no changelog for most recent commit: CHANGELOG.md's most recent unpublished changelog commit hash starts with ${blameHash}, but most recent commit hash is ${mostRecentLog.latest.hash}`,
    );
  }

  console.log("Changelog for most recent commit was found!");
}

export async function prepareRelease() {
  const changelogPath = path.resolve(process.cwd(), "CHANGELOG.md");
  const packageJson = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), "package.json"), "utf-8"),
  );
  const originalChangelogLines = fs
    .readFileSync(changelogPath, "utf-8")
    .split("\n");
  if (!originalChangelogLines[0].startsWith("# Unpublished")) {
    throw Error(`heeler: CHANGELOG.md doesn't have any unpublished changelogs`);
  }

  const git = simpleGit();
  const logs = await git.log({ maxCount: 40 });

  const blame = await git.raw(["blame", changelogPath]);
  const blameLines = blame.split("\n");

  let unpublishedLines = true,
    i = 1,
    versionBump = "",
    changelogLines = [];

  while (unpublishedLines && i < blameLines.length) {
    const regexResult = /(.+) \(.+\) (.+)/g.exec(blameLines[i++]);
    if (regexResult) {
      const [_, commitHash, message] = regexResult;
      if (message.startsWith("#")) {
        unpublishedLines = false;
      } else {
        const gitLog = logs.all.find((log) => log.hash.startsWith(commitHash));
        if (!gitLog) {
          throw Error(
            `Could not find git log for changelog entry: "${message}"`,
          );
        }
        const [_, changeType] = /\- \((.+)\)/g.exec(message);
        if (changeType === "breaking") {
          versionBump = "major";
        } else if (changeType === "feature" && versionBump !== "major") {
          versionBump = "minor";
        } else if (!versionBump) {
          versionBump = "patch";
        }
        changelogLines.push(message.replace("COMMIT_MSG", gitLog.message));
      }
    }
  }

  const s = semver.parse(packageJson.version);
  const newVersion = s.inc(versionBump);
  const unalteredLines = originalChangelogLines.slice(i);

  fs.writeFileSync(
    changelogPath,
    `# ${newVersion}\n\n${changelogLines.join("\n")}\n${unalteredLines}`,
  );
  console.log("CHANGELOG.md updated and is ready for release");
}
