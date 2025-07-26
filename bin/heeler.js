import inquirer from "inquirer";
import {
  addToChangelog,
  assertChangelogMostRecentCommit,
} from "../src/changelog-utils.js";

if (process.argv.length < 3) {
  throw Error(`heeler requires one of the following commands: add, check`);
}

const command = process.argv[2];

switch (command) {
  case "add":
    inquirer
      .prompt([
        {
          name: "changetype",
          message: "Is this a breaking change, new feature, or fix?",
          type: "list",
          choices: ["breaking", "feature", "fix"],
        },
        {
          name: "message",
          type: "editor",
          message: "Changelog entry",
        },
      ])
      .then((answers) => {
        return addToChangelog(answers);
      });
    break;
  case "check":
    assertChangelogMostRecentCommit();
    break;
  default:
    throw Error(`Unsupported heeler command '${command}'`);
}
