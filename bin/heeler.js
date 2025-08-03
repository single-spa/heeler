import { select } from "@inquirer/prompts";
import { addToChangelog, prepareRelease } from "../src/changelog-utils.js";

if (process.argv.length < 3) {
  throw Error(`heeler requires one of the following commands: add, prep`);
}

const command = process.argv[2];

switch (command) {
  case "add":
    const answer = await select({
      message: "Is this a breaking change, new feature, or fix?",
      choices: [
        {
          name: "breaking",
          value: "breaking",
        },
        {
          name: "feature",
          value: "feature",
        },
        {
          name: "fix",
          value: "fix",
        },
        {
          name: "skip",
          value: "skip",
        },
      ],
    });

    if (answer !== "skip") {
      addToChangelog(answer);
    }
    break;
  case "prep":
    prepareRelease();
    break;
  default:
    throw Error(`Unsupported heeler command '${command}'`);
}
