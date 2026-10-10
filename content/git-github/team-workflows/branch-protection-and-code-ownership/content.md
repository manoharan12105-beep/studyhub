# Branch Protection and Code Ownership

**Module:** Team Collaboration Workflows · **Interview priority:** Frequently asked

> [!NOTE]
> GitHub settings are described as of 2026 (**Instruction only** — no repository settings were changed for this lesson). GitHub offers both classic **branch protection rules** and newer **rulesets**; the protections below exist in both.

## Learning Objectives

- Protect `main` so changes arrive only through reviewed, tested pull requests.
- Write a `CODEOWNERS` file and explain how code-owner reviews work.
- Explain why server-side protection beats client-side discipline.

## What Is It?

- **Branch protection** (or a **ruleset**) is a set of server-side rules on branches matching a pattern (`main`, `release/*`) that restrict how they can change: no direct pushes, required reviews, required status checks, no force pushes or deletion.
- **Code owners** are people or teams responsible for parts of the codebase, declared in a `CODEOWNERS` file. They're automatically requested as reviewers on PRs touching their files, and protection can require their approval.

## Why It Matters

Local habits (`--force-with-lease`, "always open a PR") fail exactly when someone is rushed. Rules enforced by GitHub apply to everyone, every time. They're also how a team guarantees that `main` — which CI deploys — has always been reviewed and tested.

## How It Works

### Common protections for `main`

| Rule | Effect |
|------|--------|
| Require a pull request before merging | No direct pushes; every change goes through a PR |
| Required approvals (e.g. 1 or 2) | Merge blocked until enough reviewers approve |
| Dismiss stale approvals when new commits are pushed | Approval applies to what's actually merged |
| Require review from code owners | Owners of touched files must approve |
| Require status checks to pass | e.g. the Maven build/test job must be green |
| Require branches to be up to date | PR must include the latest `main` before merging (or use a merge queue) |
| Require conversation resolution | All review threads resolved |
| Require linear history | Only squash/rebase merges |
| Block force pushes / deletions | History of `main` can't be rewritten or removed |
| Restrict who can push or bypass | Even admins follow the rules unless explicitly allowed |

When someone pushes directly to a protected `main`, the push is rejected with a message (`remote: error: GH006: Protected branch update failed …` on classic protection) naming the rule.

### CODEOWNERS

A file at `.github/CODEOWNERS` (or the repository root, or `docs/`), on the base branch:

```text
# Default owners for everything
*                                   @your-org/gradebook-devs

# Grading rules need the assessment team's approval
src/main/java/com/example/gradebook/GradeCalculator.java   @your-org/assessment

# Build and CI changes need a lead
pom.xml                             @priya-lead
.github/workflows/                  @priya-lead
```

- Patterns work like `.gitignore`; the **last matching line wins**.
- Owners are `@user`, `@org/team` or emails; they need write access.
- With "Require review from code owners", a PR touching `GradeCalculator.java` can't merge without an approval from `@your-org/assessment`.

### Merge queue and auto-merge

On busy repositories, "required up to date" forces constant rebasing. A **merge queue** takes approved PRs, tests each one combined with the PRs ahead of it, and merges them in order. **Auto-merge** merges a PR as soon as all requirements pass.

## Client-Side vs Server-Side

| Client-side (your machine) | Server-side (GitHub) |
|----------------------------|----------------------|
| Git hooks, aliases, habits, `--force-with-lease` | Branch protection, rulesets, required checks, push protection |
| Skippable (`--no-verify`, a different machine) | Applies to every push and merge |
| Fast feedback | Enforcement |

Use both: local tools for fast feedback, server rules for guarantees ([Git Hooks Fundamentals](../../git-hooks/git-hooks-fundamentals/content.md)).

## Commands

```bash
# Illustrative — rules are configured in Settings → Branches / Rules, or via the API/CLI.
gh api repos/your-org/gradebook/branches/main/protection    # read the current protection
```

| Command | Purpose | Safety |
|---------|---------|--------|
| `git push origin main` (on a protected branch) | Rejected by the server unless allowed | — |
| `git push origin feature/x` + PR | The permitted path | **Changes the remote** |

## Step-by-Step Example

Protect gradebook's `main` for a team of five:

1. Rule for `main`: require a PR, 1 approval, dismiss stale approvals, require code-owner review.
2. Require the status check `build` (the GitHub Actions Maven job) and conversation resolution.
3. Block force pushes and deletion; don't allow bypass.
4. Add `.github/CODEOWNERS` as above via a PR.
5. Test: a direct `git push origin main` is rejected; a PR without approval can't merge.

## Common Mistakes

- **Requiring a status check by a name that never runs** — every PR is blocked forever. Pick checks from ones that have run.
- **Letting admins bypass** "just in case" — then the rules aren't rules.
- **A CODEOWNERS line for a team without write access** — owners aren't requested.
- **Protecting `main` but not `release/*`** where hotfixes land.

## Interview Angle

"How do you stop people pushing broken code to `main`?" — branch protection: PRs required, approvals, required CI checks, no force pushes; plus code owners for sensitive areas. Emphasise that server-side rules enforce what local hooks can only encourage.

## Recap

- Branch protection/rulesets enforce PRs, reviews, checks and no force pushes on the server.
- `CODEOWNERS` maps paths to owners; protection can require their approval.
- Merge queues and auto-merge keep protected branches flowing.
- Local hooks give feedback; server rules give guarantees.

## Related Topics

- [Merging Pull Requests](../../pull-requests-and-review/merging-pull-requests/content.md)
- [Push Rejection and Force-with-Lease](../../remote-repositories/push-rejection-and-divergence/content.md)
- DevOps: [CI with GitHub Actions](../../../devops/ci-cd/ci-with-github-actions/content.md)
