---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*), Bash(git diff:*)
description: Stage and commit changes with a descriptive message
---

## Context

- Current git status: !`git status`
- Staged and unstaged changes: !`git diff HEAD`
- Current branch: !`git branch --show-current`
- Recent commits: !`git log --oneline -10`

## Your task

Based on the above changes, create a single git commit.

Rules:
- Write a concise commit message (imperative mood, <72 chars subject)
- Add a blank line then a body explaining "why" if the change is non-trivial
- Stage only relevant files — do not use `git add -A` or `git add .`
- Use a HEREDOC for the commit message
- Append `Co-Authored-By: Claude <noreply@anthropic.com>` to the message
- Do not push. Do not use any other tools. Output only tool calls, no extra text.
