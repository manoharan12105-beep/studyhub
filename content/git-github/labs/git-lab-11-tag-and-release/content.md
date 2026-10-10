# Lab 11 — Tag a Version and Prepare a Release

**Lab:** 11 · **Module:** Tags, Releases and Versioning · **Difficulty:** Intermediate · **Verification:** Partly tested

> [!NOTE]
> Versioning, tagging, building from the tag and pushing to the stand-in remote were run (Maven 3.9.12). Creating the GitHub Release itself was not run (Instruction only).

## Objective

Release gradebook 1.0.0: set the Maven version, create an annotated tag, build the JAR, push the tag, start the next development version, draft release notes, and mark a release candidate.

## Prerequisites

- Lessons: [Lightweight and Annotated Tags](../../tags-and-releases/git-tags/content.md), [Semantic Versioning](../../tags-and-releases/semantic-versioning/content.md), [GitHub Releases](../../tags-and-releases/github-releases/content.md).

## Scenario

Two changes since the first commit — the B threshold and a clearer error message — are ready to ship as 1.0.0.

## Steps

### Step 1: Starting state

Repository with a remote (as in [Lab 02](../git-lab-02-push-to-remote/content.md)) plus two commits: "Raise the B threshold to 78" and "Explain why an empty marks list is rejected".

### Step 2: Release commit and annotated tag

In `pom.xml` change `<version>1.0.0-SNAPSHOT</version>` to `<version>1.0.0</version>`.

```bash
git diff --stat
git commit -am "Release 1.0.0"
git tag -a v1.0.0 -m "gradebook 1.0.0"
git show v1.0.0 --stat --format="%H%n%s"
```

**Output (first lines of each):**

```text
 pom.xml | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
[main f232057] Release 1.0.0
 1 file changed, 1 insertion(+), 1 deletion(-)
tag v1.0.0
Tagger: Priya Sharma <priya@example.com>

gradebook 1.0.0
f232057af8c1c5ab5efb3ea6d35f9360159e98d0
Release 1.0.0
```

### Step 3: Build the artifact from the tagged commit

```bash
mvn -B -q clean verify
ls target/*.jar
```

**Output:**

```text
target/gradebook-1.0.0.jar
```

### Step 4: Push the commit and the tag

```bash
git push origin main v1.0.0
git ls-remote --tags origin
```

**Output:**

```text
To /home/student/git-lab/remotes/gradebook.git
   1733eba..f232057  main -> main
 * [new tag]         v1.0.0 -> v1.0.0
208a72f38769e3bc489d68824c94d9a9b15cbb5a	refs/tags/v1.0.0
f232057af8c1c5ab5efb3ea6d35f9360159e98d0	refs/tags/v1.0.0^{}
```

### Step 5: Start the next version

Set the POM version to `1.1.0-SNAPSHOT`.

```bash
git commit -qam "Start 1.1.0 development"
git describe
```

**Output:**

```text
v1.0.0-1-g480167a
```

### Step 6: Draft release notes

```bash
git log --oneline --no-merges $(git rev-list --max-parents=0 HEAD)..v1.0.0
```

**Output:**

```text
f232057 Release 1.0.0
6c1a411 Explain why an empty marks list is rejected
85bf3f4 Raise the B threshold to 78
```

Rewrite for users:

```markdown
## gradebook 1.0.0

### Changed
- **B now starts at 78 (was 75).**
- The error for an empty marks list explains that marks are needed to compute an average.
```

(For later releases the range is simply `v1.0.0..v1.1.0`.)

### Step 7: Publish the GitHub Release (instruction only)

**Releases → Draft a new release** → tag `v1.0.0` → title "gradebook 1.0.0" → paste the notes → attach `target/gradebook-1.0.0.jar` → **Publish release**. With the CLI: `gh release create v1.0.0 target/gradebook-1.0.0.jar --title "gradebook 1.0.0" --notes-file notes.md`.

**Expected result:** the release page shows the notes, the JAR and source archives, and is marked **Latest**.

### Step 8: A release candidate

```bash
git tag -a v1.1.0-rc.1 -m "gradebook 1.1.0 release candidate 1"
git tag -l --sort=v:refname
```

**Output:**

```text
v1.0.0
v1.1.0-rc.1
```

Publish it on GitHub with **Set as a pre-release** ticked. Remember `versionsort.suffix=-rc` once `v1.1.0` exists, so the candidate sorts before the release.

## Verification Checklist

- ☐ `git cat-file -t v1.0.0` prints `tag` (annotated).
- ☐ The tagged commit's POM says `1.0.0`; `main`'s POM says `1.1.0-SNAPSHOT`.
- ☐ `git ls-remote --tags origin` lists `v1.0.0`.
- ☐ Release notes describe user-visible changes, including the B threshold.

## Common Mistakes

- Tagging before committing the version change.
- `git push` without the tag name.
- Moving the tag after pushing — release `1.0.1` instead.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `fatal: tag 'v1.0.0' already exists` | Pick the next version; don't move published tags |
| JAR named `-SNAPSHOT` | The POM version wasn't changed before building |
| Tag missing on the remote | `git push origin v1.0.0` |
