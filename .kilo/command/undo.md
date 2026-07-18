# /undo — Smart Undo

Undo the last action or revert specific changes. Context-aware and safe.

## Usage

```
/undo              # Undo last commit (if yours and unpushed)
/undo staged       # Unstage all staged changes
/undo [file]       # Revert specific file to last commit
/undo wip          # Revert all unstaged tracked changes
/undo untracked    # Remove untracked files (asks first)
/undo hard         # Revert everything (staged + unstaged + untracked)
```

## Behavior

### `/undo` (no args)
1. Check `git log -1 --format='%an %ae'` — verify HEAD is your commit.
2. Check `git status` — verify branch not pushed ahead (`Your branch is ahead`).
3. If yours AND unpushed: `git reset --soft HEAD~1` (keeps changes staged).
4. If pushed: warn user and suggest `git revert` instead. Do NOT force-push.
5. If HEAD is not yours: warn and ask.

### `/undo staged`
Run `git restore --staged .` to unstage everything.

### `/undo [file]`
Run `git restore [file]` to discard changes to that file. If the file is staged, unstage first, then restore.

### `/undo wip`
Run `git checkout -- .` to revert all tracked unstaged changes. Show warning first.

### `/undo untracked`
List all untracked files with `git clean -n`, then ask before running `git clean -fd`.

### `/undo hard`
Equivalent to `/undo wip` + `/undo staged` + `/undo untracked`. Shows triple warning.

## Safety Rules

- NEVER force-push to main/master.
- NEVER run destructive undo without showing what will be undone first.
- If there's a stash, warn the user it exists.
