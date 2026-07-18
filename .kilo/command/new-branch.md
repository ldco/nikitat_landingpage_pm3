# /new-branch — Create and Switch Branch

Create a new branch from current state and switch to it.

## Usage

```
/new-branch <name>
```

## Behavior

1. If dirty working tree, auto-stash.
2. Run `git switch -c <name>`.
3. Auto-pop stash after branch creation.
4. If name already exists locally, warn and abort.

## Naming

- Name should be kebab-case: `fix-login-redirect`, `feat-blog-module`.
- If name has spaces, auto-convert to kebab-case.
