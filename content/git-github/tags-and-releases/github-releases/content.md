# GitHub Releases, Release Notes and Rollback Planning

**Module:** Tags, Releases and Versioning · **Interview priority:** Frequently asked

> [!NOTE]
> GitHub Releases are described as of 2026 (**Instruction only**). The Git commands that gather release notes and prepare hotfixes were run in the practice lab.

## Learning Objectives

- Explain the difference between a Git tag and a GitHub Release.
- Publish a release of a Java application with notes and an attached JAR.
- Plan for rollback before you need it: previous artifacts, hotfix branches and reverts.

## What Is It?

A **GitHub Release** is a GitHub page built **on top of a Git tag**: a title, release notes, downloadable **assets** (for example `gradebook-1.1.0.jar`), and flags such as **pre-release**, **draft** and **latest**. GitHub also offers the tagged source as ZIP and tarball downloads automatically.

| | Git tag | GitHub Release |
|-|---------|----------------|
| Lives in | The Git repository (`refs/tags/v1.1.0`) | GitHub's platform data |
| Contains | A pointer (+ message for annotated tags) | Tag + notes + binary assets + flags |
| Created by | `git tag`, then `git push` | Releases page, `gh release create`, or CI |
| Copied by `git clone` | Yes | No |

Creating a Release for a tag that doesn't exist yet creates the tag on GitHub too.

## Why It Matters

Users and operators don't read `git log`; they read release notes and download artifacts. And every release should come with an answer to "what do we do if this one is bad?" — rollback planning decides whether a bad deploy costs minutes or a night.

## How It Works

### Gathering release notes

```bash
git log --oneline --no-merges v1.0.0..v1.1.0
```

**Output:**

```text
3a070e0 Raise the B threshold to 78
8b503ca Show each student's average in ClassReport
d0e8c67 Round averages to two decimals
3e2381d Add ClassReport with one line per student
```

```bash
git shortlog -sn v1.0.0..v1.1.0
git diff --stat v1.0.0 v1.1.0
```

**Output:**

```text
     3	Priya Sharma
     2	Arjun Mehta
 .../java/com/example/gradebook/ClassReport.java     | 21 +++++++++++++++++++++
 .../java/com/example/gradebook/GradeCalculator.java |  5 +++--
 2 files changed, 24 insertions(+), 2 deletions(-)
```

Turn the list into notes for **people**, grouped by impact:

```markdown
## gradebook 1.1.0

### New
- ClassReport prints one line per student with grade and average (#14)

### Changed
- **The B threshold is now 78 (was 75).** Students averaging 75–77.99 now receive a C.
- Averages are rounded to two decimals.

### Upgrade notes
No API changes. Re-run reports generated with 1.0.0 if you rely on B grades.
```

GitHub's **Generate release notes** button drafts a list of merged pull requests and contributors since the previous release — a good starting point that you then edit.

### Publishing

On GitHub: **Releases → Draft a new release** → choose tag `v1.1.0` (existing, or create it on a target commit) → title → notes → attach `target/gradebook-1.1.0.jar` → mark as **pre-release** for `-rc` versions → **Publish** (or save as **draft**).

```bash
# Illustrative — requires the GitHub CLI; normally run by CI after tests pass
mvn -B verify
gh release create v1.1.0 target/gradebook-1.1.0.jar --title "gradebook 1.1.0" --notes-file notes.md
gh release create v1.2.0-rc.1 --prerelease --generate-notes
```

Automating this in a GitHub Actions workflow triggered by pushing a `v*` tag belongs to DevOps: [CI with GitHub Actions](../../../devops/ci-cd/ci-with-github-actions/content.md) and [CD and Automated Deployment](../../../devops/ci-cd/cd-automated-deployment/content.md).

## Tagging a Stable Java Version

1. Merge everything for the release into `main`; CI green.
2. Set `<version>1.1.0</version>` in `pom.xml`, commit "Release 1.1.0".
3. `git tag -a v1.1.0 -m "Release 1.1.0"` and `git push origin main v1.1.0`.
4. Build the JAR **from the tag** (CI checks out `v1.1.0`), attach it to the release.
5. Bump to `1.2.0-SNAPSHOT`, commit "Start 1.2.0 development".

Building from the tag guarantees the published artifact matches the tagged source.

## Rollback Planning

Decide **before** releasing:

| Question | Typical answer |
|----------|----------------|
| What's the last known-good version? | The previous release tag (`v1.0.0`) and its kept artifact |
| How do we redeploy it? | Deploy the previous artifact/image — fastest; no rebuild |
| How do we fix forward? | `git revert` the bad change on `main` and release `v1.1.1` |
| How do we patch an old line? | Branch from the tag: `git switch -c hotfix/1.1.1 v1.1.0`, fix, tag `v1.1.1`, merge the fix back to `main` |
| Is the data compatible? | Database migrations may make rollback impossible — design them backward-compatible |

```bash
git switch -c hotfix/1.1.1 v1.1.0
```

**Output:**

```text
Switched to a new branch 'hotfix/1.1.1'
```

> [!IMPORTANT]
> Never "roll back" by moving or deleting a published tag or force-pushing `main`. Roll back the **deployment** to the previous artifact, and roll **forward** in Git with reverts and a new version.

## Commands

| Command | Purpose | Safety |
|---------|---------|--------|
| `git log --oneline --no-merges vA..vB` | Changes between releases | Safe anywhere |
| `git shortlog -sn vA..vB` | Contributors | Safe anywhere |
| `git switch -c hotfix/x.y.z vX.Y.Z` | Patch an old release | Changes local state |
| `gh release create <tag> [assets] …` | Publish a GitHub Release | **Changes the remote** |

## Step-by-Step Example

Releasing gradebook 1.1.0 and then hot-fixing it:

1. Tag `v1.1.0` on the CI-tested commit; publish the release with notes and the JAR.
2. A bug report: a 0-mark student crashes the report.
3. `git switch -c hotfix/1.1.1 v1.1.0`, fix with a test, `mvn -B verify`.
4. Tag `v1.1.1`, push, publish the release.
5. Merge (or cherry-pick) the fix into `main` so 1.2.0 includes it.

## Common Mistakes

- **Release notes that are just commit hashes** — write for users; call out breaking changes.
- **Building artifacts from a developer's laptop** instead of from the tag in CI.
- **No kept previous artifact** — rollback then requires an emergency rebuild.
- **Fixing the hotfix only on the release branch** — the bug returns in the next release.

## Interview Angle

"Tag vs GitHub Release?" — a tag is a Git ref copied with every clone; a Release is GitHub data built on a tag with notes, assets and flags. "How do you roll back a bad release?" — redeploy the previous artifact immediately, then fix forward with revert or a hotfix branch from the tag and a new patch version; never move tags.

## Recap

- A Release = tag + notes + assets + flags, stored on GitHub.
- Gather notes with `git log vA..vB`; write them for users.
- Build and attach artifacts from the tag, ideally in CI.
- Rollback = previous artifact now, revert/hotfix and a new version next.

## Related Topics

- [Lightweight and Annotated Tags](../git-tags/content.md)
- [git revert](../../undoing-and-recovery/git-revert/content.md)
- [Lab 11 — Tag a Version and Prepare a Release](../../labs/git-lab-11-tag-and-release/content.md)
