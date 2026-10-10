# Gitflow and Trunk-Based Development

**Module:** Team Collaboration Workflows · **Interview priority:** Frequently asked

## Learning Objectives

- Describe Gitflow's branch types and its release process.
- Describe trunk-based development, short-lived branches and feature flags.
- Weigh the trade-offs and match each model to a release style.

## What Is It?

Two well-known **branching models** — conventions about which long-lived branches exist and how work flows between them:

- **Gitflow** (described by Vincent Driessen in 2010): long-lived `main` and `develop` branches, plus `feature/*`, `release/*` and `hotfix/*` branches with defined merge paths.
- **Trunk-based development**: one main branch (the "trunk", usually `main`) that everyone integrates into **at least daily**, via very short-lived branches or directly, with unfinished work hidden behind **feature flags**.

## Why It Matters

The model determines how often code integrates, how releases are cut and how painful merges get. "Gitflow vs trunk-based?" is a common interview question because the answer reveals whether you understand integration risk and continuous delivery.

## How It Works

### Gitflow

```text
main     ●───────────────────●──────────────●───────►   (tags: v1.0.0, v1.0.1, v1.1.0)
          \                 / \            /
hotfix/1.0.1                 ●───●        /
develop   ●──●─────●────●───●──────●─────●───────────►
              \   /      \           \   /
feature/x      ●─●        \           ●─●   feature/y
release/1.1                ●──●──●   (stabilise, then merge to main AND develop)
```

| Branch | From | Merges into | Purpose |
|--------|------|-------------|---------|
| `main` | — | — | Production releases only; every commit tagged |
| `develop` | `main` | — | Integration branch for the next release |
| `feature/*` | `develop` | `develop` | One feature |
| `release/*` | `develop` | `main` and `develop` | Stabilise a version: bug fixes, version numbers |
| `hotfix/*` | `main` | `main` and `develop` | Urgent production fix |

### Trunk-based development

```text
main ──●──●──●──●──●──●──●──●──●──●──►    (always releasable; deploy any commit)
         \_/   \_/      \__/
        branches live hours to a day or two; merged via quick PRs
```

- Branches are tiny and short-lived; integration happens continuously.
- Incomplete features ship **disabled** behind feature flags instead of living on long branches.
- Releases are cut from `main` (tag a commit) or deployed continuously; optional short-lived release branches for hotfixes.
- Requires strong automated tests and CI, because `main` must stay green.

## Trade-offs

| | Gitflow | Trunk-based |
|-|---------|-------------|
| Integration frequency | Per feature/release — can be weeks | Daily or more |
| Merge conflicts | Larger, later | Small, constant |
| Release style | Scheduled, versioned releases; several versions maintained | Continuous delivery/deployment |
| Process overhead | High (many branch types, double merges) | Low branching overhead, high testing discipline |
| Unfinished work | Lives on feature branches | Hidden behind feature flags |
| Typical fit | Packaged software, mobile apps with store releases, regulated release cycles | Web services and teams practising CI/CD |

Neither is universally better. Gitflow's own author later noted that teams doing continuous delivery of web applications may prefer simpler models such as GitHub flow (feature branches merged to `main`, deploy from `main`) — which sits close to trunk-based development.

## Short-Lived Branches: Why They Win Conflicts

Conflict size grows with the time two branches stay apart and the amount of code they both touch. A branch merged within a day conflicts with a day's worth of others' work; a month-long branch with a month's. That's the core argument for short-lived branches in any model.

## Commands

Both models use ordinary commands — the difference is discipline:

```bash
# Gitflow: start a release and finish it (illustrative branch names)
git switch -c release/1.1 develop
# … fixes, bump version in pom.xml …
git switch main && git merge --no-ff release/1.1 && git tag -a v1.1.0 -m "Release 1.1.0"
git switch develop && git merge --no-ff release/1.1

# Trunk-based: small branch, merged the same day
git switch -c fix/rounding origin/main
# … one small change + tests …
git push -u origin fix/rounding    # PR, quick review, merge
```

## Step-by-Step Example

**Gradebook as a desktop app shipped each term:** Gitflow (or a lighter `main` + `release/*`) — the team stabilises `release/2026-term2`, tags `v2.0.0`, and hot-fixes `v2.0.1` while `develop` continues.

**Gradebook as a web service deployed daily:** trunk-based — every PR is small, CI runs the full test suite, merges deploy automatically, and the new "weighted averages" feature ships behind a flag until it's complete.

## Common Mistakes

- **Gitflow for a two-person web app** — `develop` duplicates `main` and double merges add work for nothing.
- **"Trunk-based" with week-long branches** — that's just feature branches merged late.
- **Feature flags never removed** — remove them once a feature is fully released.
- **Forgetting to merge a hotfix back into `develop`** in Gitflow — the bug returns in the next release.

## Interview Angle

"Gitflow vs trunk-based development?" — Gitflow: develop/feature/release/hotfix branches, suits versioned scheduled releases, more overhead and later integration. Trunk-based: integrate into `main` at least daily with short branches and feature flags, suits CI/CD, demands strong tests. Conclude with "it depends on the release model", and give an example.

## Recap

- Gitflow: `main` + `develop` + feature/release/hotfix branches; structured, heavier.
- Trunk-based: integrate into `main` daily; short branches; feature flags; strong CI.
- Short-lived branches mean small conflicts in any model.
- Match the model to how you release.

## Related Topics

- [Collaboration Workflows](../git-collaboration-workflows/content.md)
- [Tags and Semantic Versioning](../../tags-and-releases/semantic-versioning/content.md)
- DevOps: [CD and Automated Deployment](../../../devops/ci-cd/cd-automated-deployment/content.md)
