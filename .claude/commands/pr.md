---
allowed-tools: Bash(git:*), Bash(gh:*), Read, Edit
description: Bump version, update changelog, push branch and create a PR
---

## Context

- Current branch: !`git branch --show-current`
- Default branch: !`git rev-parse --abbrev-ref origin/HEAD 2>/dev/null || echo main`
- Commits on this branch: !`git log --oneline origin/main..HEAD 2>/dev/null || git log --oneline -20`
- Changed files: !`git diff --stat origin/main..HEAD 2>/dev/null || git diff --stat HEAD~1`
- Current version: !`node -p "require('./package.json').version"`

## Your task

Create a pull request for the current branch. Always bump the version and update the changelog first.

Steps:

### 1. Bump version
- Read `package.json` and increment the **patch** version (e.g. 0.0.2 → 0.0.3). If the branch contains breaking changes or new features, bump minor instead.
- Edit the `"version"` field in `package.json` using the Edit tool.

### 2. Update CHANGELOG.md
- Read `CHANGELOG.md`.
- Add a new section at the top (below the `# Changelog` heading) for the new version with today's date.
- Group changes from the commits above by type: **Added**, **Fixed**, **Changed**, **Removed** (omit empty groups).
- Use the Edit tool to insert the new section.

### 3. Commit the version bump
- Stage `package.json` and `CHANGELOG.md` and create a commit:
  `chore: bump version to <new_version> and update changelog`
  with co-author line: `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`

### 4. Push and create PR
- Push the current branch to origin with `-u`
- Create the PR using `gh pr create` with:
  - A short title (<70 chars) summarizing the branch purpose
  - A body using this structure (via HEREDOC):
    ## Changelog
    <grouped bullet list of changes from commits>

    ## Summary
    <1-3 sentences on what this PR accomplishes>

Output only tool calls, no extra text.
