# /pr — Create Pull Request

Push the current branch and create a well-formed pull request.

## Usage

```
/pr
/pr [title hint]
```

## Behavior

1. Check current branch is not main/master — warn if it is.
2. Check all changes are committed (`git status` must be clean).
3. Push current branch to remote with `-u` flag.
4. Run `git log <base-branch>..HEAD --oneline` to gather all commit messages.
5. Auto-generate PR title from the most significant commit message or from the hint.
6. Auto-generate PR body with:
   - Summary bullet points from all commits
   - Files changed count
   - Test plan placeholder
7. Open PR via `gh pr create --title "..." --body "$(...)"`.
8. Return the PR URL.

## Base Branch Detection

- Default: `main` or `master` (check `git branch -r`).
- If branch name starts with `feat/` → base is `main`.
- If branch name starts with `fix/` → base is `main`.
