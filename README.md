# heeler

heeler is a changelog management library that asks the developer to specify whether a commit is breaking, feature, or patch, during a pre-commit hook.

## Installation

```sh
pnpm i --save-dev heeler husky

pnpm exec husky

echo -e "exec < /dev/tty\nif node bin/heeler.js add $(cat $1); then\n  git add .changelog\n  git commit --amend --no-edit --no-verify\nfi" > .husky/commit-msg
```

## Usage

Whenever a user runs `git commit`, they will be prompted for whether the change is breaking, feature, or fix. A line is added to the CHANGELOG.md for all commits that are unpublished.

When publishing, run the `heeler prep` command beforehand to update the CHANGELOG.md to have the correct version number and messages.
