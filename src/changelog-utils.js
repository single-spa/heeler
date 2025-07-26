import fs from "node:fs";
import path from "path";
import simpleGit from "simple-git";

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

  const startStr = "# Unpublished\n";
  let sliceIndex;

  if (changelog.startsWith(startStr)) {
    sliceIndex = startStr.length;
  } else {
    sliceIndex = 0;
  }

  const newEntry = `- (${answers.changetype}): ${answers.message.replace("\n", "")}\n`;

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

  const blameHash = firstChangelogEntry.slice(
    0,
    firstChangelogEntry.indexOf(" "),
  );
  if (!mostRecentLog.latest.hash.startsWith(blameHash)) {
    throw Error(
      `heeler: no changelog for most recent commit: CHANGELOG.md's most recent unpublished changelog commit hash starts with ${blameHash}, but most recent commit hash is ${mostRecentLog.latest.hash}`,
    );
  }

  console.log("Changelog for most recent commit was found!");
}
