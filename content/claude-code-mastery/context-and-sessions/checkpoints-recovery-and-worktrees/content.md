# Checkpoints, Recovery and Parallel Work with Worktrees

**Module:** Context Windows, Sessions and Checkpoints · **Interview priority:** Core

## Definition

A **checkpoint** is a snapshot Claude Code takes of the files Claude is about to edit, created at each prompt that starts a turn. **`/rewind`** (or `Esc` twice on an empty prompt) restores code, conversation or both to an earlier checkpoint. **Recovery** is the wider skill of getting back to a known-good state after an unwanted change — using checkpoints for quick, local undo and **Git** for everything else. A **git worktree** is a second working directory of the same repository on its own branch, which lets two Claude Code sessions work in parallel without overwriting each other.

## Why It Matters

- Agents make mistakes quickly and across many files. Fast, reliable undo is what makes it reasonable to let Claude try things.
- Checkpoints have hard limits. People who believe "I can always rewind" lose work when a change came from a shell command or a subagent.
- Parallel work — one session fixing a bug while another builds a feature — corrupts both unless each has its own working directory.

## How It Works

```text
prompt 1 ──► checkpoint A (snapshots of files Claude then edits)
prompt 2 ──► checkpoint B
prompt 3 ──► checkpoint C          /rewind → pick prompt 2 → choose:
                                     • Restore code and conversation
                                     • Restore conversation  (keep current files)
                                     • Restore code          (keep conversation)
                                     • Summarize from here / up to here
                                     • Never mind
```

- Every prompt that starts a turn creates a checkpoint; snapshots are kept for the 100 most recent checkpoints of a session.
- Checkpoints are saved with the conversation, so `/rewind` still works after you resume.
- Snapshots are deleted with the session's retention (about 30 days by default).

## What Checkpoints Cannot Undo

| Change | Restored by `/rewind`? |
|--------|------------------------|
| Edits made with Claude's file tools (Edit, Write) | **Yes** |
| Files changed by **Bash** commands (`rm`, `mv`, `cp`, `sed -i`, a build that writes files) | **No** |
| Edits made by a **subagent** (except a foreground forked skill) | **No** — use Git |
| Changes you or another session made outside this session | **No** (usually not captured) |
| Symlinked or hard-linked files | **No** — skipped with a warning |
| Database rows, deployed services, pushed commits, sent messages | **No** — nothing local can undo remote effects |

The checkpointing docs say it plainly: checkpoints are for quick session-level recovery and are **not a replacement for version control**.

## Recovering from a Failed Change

Work from the safest step to the most destructive, and **save before you discard**:

```text
1. STOP        Esc — stop Claude before it digs deeper
2. LOOK        git status · git diff --stat · git diff <file>
3. SAVE        git stash push -u -m "claude attempt 1"     (or commit on a rescue branch)
4. UNDO        /rewind (file-tool edits) · git restore <file> · git revert <commit>
5. VERIFY      run the build and tests; git status is clean or as expected
6. LEARN       tell Claude what went wrong; adjust the prompt, plan or rules
```

| Situation | Recovery |
|-----------|----------|
| Claude's last edits are wrong, made with file tools | `/rewind` → **Restore code** to the prompt before |
| Claude also ran `sed -i` or deleted files | `git status` shows them; `git restore <file>` for tracked files; untracked deletions need a stash or backup |
| Several commits on a feature branch are wrong | `git revert <sha>` (keeps history) or reset your *local, unpushed* branch after stashing |
| A subagent rewrote files | Git only — checkpoints did not capture them |
| The change was pushed | `git revert` and push the revert; never force-push a shared branch to "undo" |

> [!CAUTION]
> `git restore .`, `git checkout -- .`, `git reset --hard` and `git clean -fd` discard uncommitted work permanently. Run `git status` first and stash anything you might want. Auto mode blocks these commands by default for the same reason.

## Git Worktrees for Parallel Sessions

```bash
claude --worktree pay-endpoint
```

This creates `.claude/worktrees/pay-endpoint/` at the repository root on a new branch `worktree-pay-endpoint`, and starts Claude in it. Run the command with another name in a second terminal for a second isolated session. Omit the name and Claude generates one.

| Detail | Behaviour |
|--------|-----------|
| Location and branch | `.claude/worktrees/<name>/`, branch `worktree-<name>` |
| Environment | A fresh checkout — install dependencies or build there; a `.worktreeinclude` file copies gitignored files such as `.env` into new worktrees |
| On exit, clean worktree | Removed automatically (named sessions ask first) |
| On exit, work in progress | You choose to keep or remove; keeping prints the command to resume |
| Ask during a session | "work in a worktree" — Claude uses the `EnterWorktree` tool |
| Subagents | `isolation: worktree` gives a subagent its own temporary worktree |
| Trust | Interactive runs require the folder to be trusted first |

Add `.claude/worktrees/` to `.gitignore`. You can also manage worktrees yourself:

```bash
git worktree add ../orderdesk-feature -b feature/pay
git worktree list
git worktree remove ../orderdesk-feature
```

## Real-World Example

You ask Claude to "simplify OrderController". It edits the controller, renames a method used by tests, and runs `sed -i` to update three test files. The build fails.

1. `Esc`. `git status` shows four modified files.
2. `git stash push -u -m "simplify attempt"` — saved, just in case.
3. `git stash show -p` to review later if needed; the working tree is clean again.
4. Re-prompt in plan mode: "Propose how to simplify OrderController without renaming public methods; list every file you would change."

Using only `/rewind` here would restore the controller but **not** the three test files changed by `sed`.

## Step-by-Step Walkthrough

1. Commit or stash before a risky request — a known-good point outside the session.
2. Ask for the change. If it goes wrong, press `Esc`.
3. Use `/rewind` → **Restore code** for file-tool edits.
4. Check `git status` for anything the rewind did not cover (shell edits, subagent edits).
5. Restore or stash those with Git, then run the tests.
6. For parallel work, start each session with `claude --worktree <name>`.

[Lab 07](../../labs/cc-lab-07-recover-unwanted-change/content.md) practises this on orderdesk.

## Common Mistakes

- Believing `/rewind` undoes everything, including `rm` and `sed -i`.
- Running `git reset --hard` without looking at `git status` or stashing first.
- Two sessions editing the same working directory "to go faster".
- Leaving many abandoned worktrees with uncommitted changes.
- Force-pushing to undo a pushed mistake on a shared branch.

## Security Considerations

- No local undo reverses remote effects — a migration on a shared database, a deployment, a message, a pushed secret. Those must be prevented, not rewound: keep them behind ask/deny rules and human approval.
- A pushed secret must be **revoked and rotated**; removing it from history is not enough.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `/rewind` offers no "Restore code" | No tracked file edits after that point | The change came from Bash or elsewhere — use Git |
| `No files were restored` | Snapshots aged out | Use Git |
| `Restored the code, but skipped N files` | Symlinks or hard links | Restore those files by hand |
| `--worktree` exits with a trust error | Folder never trusted | Run `claude` once in the repository and accept trust |
| Worktree build fails | Fresh checkout lacks dependencies or `.env` | Build in the worktree; add `.worktreeinclude` |

## Trade-offs

| Tool | Speed | Coverage | Lifetime |
|------|-------|----------|----------|
| `/rewind` | Instant | Claude's file-tool edits only | The session's retention |
| `git stash` / commits | Seconds | Every tracked (and with `-u`, untracked) file | Until you delete it |
| Worktrees | Setup per worktree | Full isolation of parallel edits | Until removed |

## Interview Takeaways

- Explain checkpoints and the rewind options, and list what they cannot undo.
- Describe a safe recovery sequence: stop, inspect, save, undo, verify.
- Explain worktrees for parallel sessions and subagent isolation.

## Key Takeaways

- Checkpoints undo Claude's file-tool edits quickly; they miss shell edits, subagent edits and remote effects.
- Git is the real safety net: commit or stash before risky work; stash before discarding.
- Destructive Git commands need a look at `git status` first.
- One session per working directory; use `claude --worktree` for parallel work.
