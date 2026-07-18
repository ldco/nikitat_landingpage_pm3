# /what-changed — Diff Summary

Show a clean summary of what changed in the working tree. No commit is made.

## Usage

```
/what-changed
```

## Behavior

1. Run `git status` and `git diff --stat` + `git diff --staged --stat`.
2. Analyze the diff and produce a summary:

```
## Working Tree Summary

### Staged (will commit)
- 3 files changed, +45 -12
- app/components/molecules/BlogPostCard.vue (+30)
- server/api/auth/login.post.ts (+10 -8)
- docs/cheatsheet.md (+5 -4)

### Unstaged
- 1 file changed, +3 -1
- app/composables/useAuth.ts (+3 -1)

### Untracked
- app/components/atoms/NewWidget.vue

### Recommended commit message
feat(blog): add reading-time badge to post cards
```

3. Include a recommended conventional-commit message based on the diff.

## Rules

- Do NOT commit anything.
- Do NOT stage anything.
- Only READ and REPORT.
