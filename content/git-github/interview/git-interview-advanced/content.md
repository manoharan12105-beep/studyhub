# Git Interview Questions: Advanced — Internals, History Rewriting and Recovery

**Module:** Git Interview Preparation · **Interview priority:** Frequently asked

## Learning Objectives

- Explain Git's object model, refs and storage at interview depth.
- Answer questions on history rewriting, reflog recovery and remote divergence with precise mechanisms.
- Handle "why" follow-ups that probe beyond the commands.

## What Is It?

Advanced Git questions appear in senior, DevOps-leaning and "tell me how it works" interviews: the object model, why hashes change, how the reflog recovers commits, what `--force-with-lease` really checks, how merges find a base, and why snapshots are cheap.

## Why It Matters

You rarely need internals day to day — until something goes wrong. Interviewers use these questions to see whether you could recover a damaged repository or reason about an unfamiliar situation rather than search for a recipe.

## Answering Deep Questions

```text
model     → "Commits point to trees and parents; refs point to commits."
mechanism → "So when X happens, Git does Y to these objects/refs."
evidence  → "You can see it with git cat-file / reflog / rev-parse."
risk      → "Which is why Z is dangerous on shared branches."
```

The supporting lessons: [The Git Object Model](../../git-internals/git-object-model/content.md), [References and HEAD Internals](../../git-internals/refs-and-head-internals/content.md), [git reflog](../../undoing-and-recovery/git-reflog/content.md), [Rewriting History Safely](../../rebasing-and-rewriting/rewriting-history-safely/content.md).

## Key Takeaways

- Tie every answer to objects and refs.
- Name the command that proves your claim.
- End with the practical consequence (safety, recovery, performance).

## Related Topics

- [Command Comparisons](../git-interview-command-comparisons/content.md)
- [Scenario Questions](../git-interview-scenarios/content.md)
- [Snapshots, Packfiles and Storage](../../git-internals/packfiles-and-storage/content.md)
