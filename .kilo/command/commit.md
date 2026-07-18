# /commit — Smart Commit

Auto-analyze working tree changes and create a well-formed conventional commit.

## Usage

```
/commit
/commit [hint]
```

Optionally pass a hint like `"fix login timeout"` to guide the message. Without a hint, the agent reads the diff and generates the message.

## Behavior

1. Run `git status` and `git diff --staged` + `git diff` to see what changed.
2. If nothing is staged, auto-stage all changes.
3. Analyze the diff to determine type: `feat`, `fix`, `refactor`, `style`, `docs`, `test`, `chore`, `perf`, `ci`.
4. Generate a conventional commit message: `<type>(<scope>): <subject>`.
5. Determine if `(scope)` is useful — include only when it adds clarity (e.g. `feat(blog): ...`).
6. Commit with the generated message.
7. If pre-commit hooks fail, auto-fix and re-commit (max 2 retries).

## Rules

- NEVER commit `.env`, credentials, or secrets. Warn if detected.
- Follow existing commit message style in the repo (`git log --oneline -10`).
- If the diff is trivial (typos only), use `chore:` or `style:` not `feat:`.
- NEVER use `--no-verify` unless the user explicitly requests it.
