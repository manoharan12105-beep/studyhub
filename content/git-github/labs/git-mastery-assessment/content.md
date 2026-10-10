# Git & GitHub Mastery Assessment

**Module:** Practical Labs and Capstone · **Interview priority:** Core

## Learning Objectives

- Check, in one sitting, whether you can use, explain and repair Git the way a working developer must.
- Find your weak areas and the lessons and labs that fix them.

## What Is It?

A comprehensive assessment combining four kinds of evidence:

| Part | What it checks | Where |
|------|----------------|-------|
| A. Commands | Choosing and predicting the right command | Practice questions P1–P10 |
| B. Concepts | The model: areas, commits, refs, objects, remotes | P11–P18 |
| C. Troubleshooting | Diagnose first, least destructive fix | P19–P26 |
| D. Team workflows | Reviews, protection, releases, collaboration | P27–P32 |
| E. Practical | Labs 01–12 completed and verified | The labs in this module |

Use the **Practice** tab for parts A–D (the multiple-choice items are checked automatically) and the labs' verification checklists for part E.

## Why It Matters

Placement interviews and the first weeks of a job test exactly this mix: everyday fluency, a correct mental model, calm recovery from mistakes, and good team habits.

## How It Works

1. Answer P1–P32 without looking at lessons; note every question you guessed.
2. Complete Labs 04, 05, 07 and 12 from scratch, without reading the step outputs first.
3. Score yourself with the rubric below.
4. Revisit the linked lessons for each missed area, then use the **Quick Revision** and **Cheat Sheets** modes.

## Rubric

| Area | Mastery looks like | Revisit if weak |
|------|--------------------|-----------------|
| Basic workflow | You predict `git status -s` codes and stage deliberately | [Three Areas](../../basic-workflow/three-areas-of-git/content.md), Lab 01, Lab 06 |
| History | You find any change with log/show/blame/grep and ranges | [git log](../../history-and-inspection/git-log/content.md), [Searching](../../advanced-inspection/searching-code-and-history/content.md) |
| Branching and integration | You merge, resolve conflicts and rebase with backups | [Merge Conflicts](../../branching-and-merging/merge-conflicts/content.md), Labs 03–05 |
| Recovery | You recover from reset, deleted branches and detached HEAD; you know what can't be recovered | [git reflog](../../undoing-and-recovery/git-reflog/content.md), Lab 07 |
| Remotes | You explain fetch/pull/push, divergence and force-with-lease | [Push Rejection](../../remote-repositories/push-rejection-and-divergence/content.md), Lab 02 |
| GitHub collaboration | You write good PRs, review well, choose merge methods | [Pull Requests](../../pull-requests-and-review/pull-requests-fundamentals/content.md), Labs 09–10 |
| Security | You keep secrets out and respond correctly to leaks | [Secrets in Git History](../../authentication-and-security/secrets-in-git-history/content.md) |
| Internals | You explain objects, refs, the index and packfiles | [Object Model](../../git-internals/git-object-model/content.md) |
| Troubleshooting | You diagnose before acting, every time | [Diagnosing Repository State](../../troubleshooting/diagnosing-repository-state/content.md), Lab 12 |

**Scoring:** 28+ of 32 correct with all four labs completed = interview-ready. 20–27 = review the weak rows. Under 20 = repeat the module path in order.

## Key Takeaways

- Mastery = fluency + model + recovery + collaboration.
- Diagnose first; prefer adding commits over rewriting shared history.
- Rotate leaked secrets before touching Git history.
- The labs are the proof — do them, don't just read them.

## Related Topics

- [Git Interview Questions: Scenarios](../../interview/git-interview-scenarios/content.md)
- [Lab 12 — Diagnose a Broken Java Repository](../git-lab-12-diagnose-broken-repository/content.md)
- [The Git Practice Lab](../../vcs-fundamentals/git-practice-lab/content.md)
