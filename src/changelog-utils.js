import fs from "node:fs";
import path from "node:path";
import semver from "semver";
import simpleGit from "simple-git";

export async function addToChangelog(changeType) {
  const changelogPath = path.resolve(process.cwd(), "./changelog");
  let existingFiles;

  try {
    existingFiles = fs.readdirSync(changelogPath);
  } catch (err) {
    fs.mkdirSync(changelogPath);
    existingFiles = [];
  }

  const git = simpleGit();
  const mostRecentLog = await git.log({ maxCount: 1 });

  fs.writeFileSync(
    path.resolve(
      process.cwd(),
      `./changelog/${existingFiles.length < 10 ? "0" : ""}${existingFiles.length + 1}.txt`,
    ),
    `${changeType}\n${mostRecentLog.latest.message}`,
    "utf-8",
  );
}

export async function prepareRelease() {
  const changelogPath = path.resolve(process.cwd(), "CHANGELOG.md");
  const packageJsonPath = path.resolve(process.cwd(), "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  const changelogLines = fs.readFileSync(changelogPath, "utf-8").split("\n");

  if (changelogLines[0] !== `# ${packageJson.name}`) {
    changelogLines.unshift(`# ${packageJson.name}`);
    changelogLines.unshift("");
  }

  let existingFiles;
  try {
    existingFiles = fs.readdirSync(path.resolve(process.cwd(), "./changelog"));
  } catch (err) {
    existingFiles = [];
  }

  if (existingFiles.length === 0) {
    throw Error(`No new changelogs found`);
  }

  existingFiles.sort();

  let versionBump = "";
  const newChangelogLines = [""];

  console.log(changelogLines);

  for (let existingFile of existingFiles) {
    const contents = fs.readFileSync(
      path.resolve(process.cwd(), "changelog", existingFile),
      "utf-8",
    );
    console.log("contents", contents);
    const [changeType, message] = contents.split("\n");

    if (changeType === "breaking") {
      versionBump = "major";
    } else if (changeType === "feature" && versionBump !== "major") {
      versionBump = "minor";
    } else if (
      changeType === "fix" &&
      !["major", "minor"].includes(versionBump)
    ) {
      versionBump = "fix";
    }

    newChangelogLines.push(`  * ${changeType}: ${message}`);
  }

  const s = semver.parse(packageJson.version);
  const newVersion = s.inc(versionBump);

  newChangelogLines.push(`## ${newVersion}`);
  newChangelogLines.reverse();

  changelogLines.splice(2, 0, ...newChangelogLines);

  fs.writeFileSync(changelogPath, changelogLines.join("\n"), "utf-8");
  console.log("CHANGELOG.md updated and is ready for release");

  packageJson.version = newVersion.version;

  fs.writeFileSync(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2),
    "utf-8",
  );

  console.log("package.json version updated");

  fs.rmSync(path.resolve(process.cwd(), "./changelog"), {
    recursive: true,
    force: true,
  });

  console.log("changelog folder deleted");
}
