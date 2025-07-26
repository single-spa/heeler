# heeler

heeler is a changelog management library that asks the developer to specify whether a commit is breaking, feature, or patch, during a pre-commit hook.

## Installation

```sh
pnpm i --save-dev heeler husky

pnpm exec husky

echo "exec < /dev/tty && pnpm exec heeler add" > .husky/pre-commit
```

Then add `pnpm exec heeler check` to your CI/CD configuration, to ensure every pull request has added to the changelog

To work with Github's actions/checkout, add the following to your Github workflow:

```yml
- uses: actions/checkout@v4
  with:
    ref: ${{ github.event_name == 'pull_request' && github.event.pull_request.head.ref || github.ref }}
```

## Usage

Whenever a user runs `git commit`, they will be prompted for whether the change is breaking, feature, or fix. A line is added to the CHANGELOG.md for all commits that are unpublished.

When publishing, run the `heeler prep` command to update the CHANGELOG.md to have the correct version number and messages.
