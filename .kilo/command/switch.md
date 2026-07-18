# /switch — Smart Branch Switch

Switch branches safely, stashing WIP if needed.

## Usage

```
/switch <branch>
```

## Behavior

1. Check if working tree is dirty (`git status --porcelain`).
2. If dirty: auto-stash with a descriptive name including the source branch and timestamp.
3. Run `git switch <branch>`.
4. If the target branch has an existing stash from a previous switch, offer to pop it.
5. If switch fails (unmerged conflicts etc.), abort and pop the stash back.

## Safety

- Prompts before popping a stash that might conflict.
- If the target branch doesn't exist locally, tries `origin/<branch>`.
