# Git Interview Questions: Scenarios and Troubleshooting

**Module:** Git Interview Preparation · **Interview priority:** Core

## Learning Objectives

- Answer "what would you do if…" Git questions with a structured, safe procedure.
- Show that you diagnose before acting and distinguish pushed from unpushed work.
- Discuss team workflow choices with trade-offs instead of absolutes.

## What Is It?

Scenario questions describe a situation — a lost commit, a secret pushed, a broken `main`, a team arguing about workflows — and ask what you'd do. There is rarely one command; the interviewer listens for **process and judgement**.

## Why It Matters

These questions predict how you behave on a real team under pressure. The strongest answers follow the same skeleton every time.

## The Scenario Answer Skeleton

```text
1. Stop and inspect      git status · git log --oneline --graph · git branch -vv · git reflog
2. Classify              local or pushed? my branch or shared? committed or not?
3. Least destructive fix restore / stash / revert / branch from reflog / force-with-lease (own branch)
4. Verify                build and tests; status clean; history as expected
5. Prevent               protection rule, hook, CI check, habit — and tell the team
```

Applying it to "You pushed a secret": inspect (which commit, which branches) → classify (pushed, public) → fix (rotate the credential **first**, then remove from code; rewrite history only if required) → verify (scan history, check access logs) → prevent (push protection, `.gitignore`, env vars).

Practise with the **troubleshooting simulator** in this subject and the [Troubleshooting Playbook](../../troubleshooting/diagnosing-repository-state/content.md).

## Key Takeaways

- Inspect → classify → least destructive fix → verify → prevent.
- "Pushed or not?" decides between rewriting and adding commits.
- For secrets, rotation comes before any Git command.
- Workflow questions: give trade-offs, not a single "best".

## Related Topics

- [Troubleshooting Commits and Branches](../../troubleshooting/troubleshooting-commits-and-branches/content.md)
- [Troubleshooting Remotes and Pushes](../../troubleshooting/troubleshooting-remotes-and-push/content.md)
- [Collaboration Workflows](../../team-workflows/git-collaboration-workflows/content.md)
