# heeler

heeler is a changelog management library that asks the developer to specify whether a commit is breaking, feature, or patch, during a pre-commit hook.

## Installation

```sh
pnpm i --save-dev heeler
```

## Usage

Contributors to a project should run `pnpm exec heeler add` to create a changelog file for their contributions.

When publishing, run the `pnpm exec heeler prep` command beforehand to update the CHANGELOG.md to have the correct version number and messages.
