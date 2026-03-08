---
allowed-tools: Bash(git:*), Bash(gh:*)
description: Push branch and create a PR with changelog
---

## Context

- Current branch: !`git branch --show-current`
- Default branch: !`git rev-parse --abbrev-ref origin/HEAD 2>/dev/null || echo main`
- Commits on this branch: !`git log --oneline origin/main..HEAD 2>/dev/null || git log --oneline -20`
- Changed files: !`git diff --stat origin/main..HEAD 2>/dev/null || git diff --stat HEAD~1`

## Your task

Create a pull request for the current branch.

Steps:
1. Push the current branch to origin with `-u`
2. Build a changelog from the commits listed above — group by type (feat, fix, chore, etc.)
3. Create the PR using `gh pr create` with:
   - A short title (<70 chars) summarizing the branch purpose
   - A body using this structure (via HEREDOC):
     ## Changelog
     <grouped bullet list of changes from commits>

     ## Summary
     <1-3 sentences on what this PR accomplishes>

Do not use any other tools. Output only tool calls, no extra text.
