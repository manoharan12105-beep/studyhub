# Semantic Versioning and Pre-Releases

**Module:** Tags, Releases and Versioning · **Interview priority:** Frequently asked

## Learning Objectives

- Read and assign versions with the MAJOR.MINOR.PATCH rules of Semantic Versioning.
- Name pre-releases and know how they sort.
- Connect versions to Git tags and the Maven `pom.xml`.

## What Is It?

**Semantic Versioning (SemVer)** is a widely used convention (semver.org, version 2.0.0) for version numbers of the form **MAJOR.MINOR.PATCH**:

| Part | Increment when | Example |
|------|----------------|---------|
| MAJOR | You make **incompatible** API changes | `1.4.2` → `2.0.0` |
| MINOR | You add functionality in a **backward-compatible** way | `1.4.2` → `1.5.0` |
| PATCH | You make backward-compatible **bug fixes** | `1.4.2` → `1.4.3` |

Incrementing a part resets the parts to its right to 0. Versions `0.y.z` are for initial development — anything may change.

## Why It Matters

A version number is a promise to users: "1.5.0 won't break code written for 1.4." Dependency managers like Maven rely on that promise when you upgrade, and a release process built on tags (`v1.5.0`) needs a consistent rule for the next number.

## How It Works

### What counts as "the API"

For a Java library: public classes, methods and their behaviour. For gradebook:

| Change | New version from `1.4.2` |
|--------|--------------------------|
| Fix: averages now round correctly | `1.4.3` |
| Add `ClassReport.highest()` | `1.5.0` |
| Rename `letterGrade()` to `grade()`, or change the B threshold that users rely on | `2.0.0` |
| Internal refactor, same behaviour | `1.4.3` (or no release) |

Changing behaviour users depend on — even without changing a method signature — is a breaking change.

### Pre-releases and build metadata

- **Pre-release:** a hyphen and identifiers: `2.0.0-alpha.1`, `2.0.0-beta.2`, `2.0.0-rc.1`. A pre-release has **lower precedence** than the release: `2.0.0-rc.1 < 2.0.0`. Use them for versions that may still change.
- **Build metadata:** a plus sign: `2.0.0+20261008` — ignored when comparing versions.

Precedence example: `1.0.0-alpha < 1.0.0-alpha.1 < 1.0.0-beta < 1.0.0-rc.1 < 1.0.0 < 1.0.1 < 1.1.0 < 1.10.0 < 2.0.0`.

### Tags and sorting

The conventional Git tag is the version with a `v` prefix: `v1.5.0`. Plain alphabetical sorting gets versions wrong:

```bash
git tag -l "v1.*"
```

**Output:**

```text
v1.0.0
v1.0.1
v1.1.0-rc.1
v1.10.0
v1.2.0
```

`--sort=v:refname` compares numbers properly:

**Output (`git tag -l --sort=v:refname "v1.*"`):**

```text
v1.0.0
v1.0.1
v1.1.0-rc.1
v1.2.0
v1.10.0
```

But Git doesn't know SemVer's pre-release rule. With both `v1.1.0` and `v1.1.0-rc.1` present:

**Output (`git tag -l --sort=v:refname "v1.1*"`):**

```text
v1.1.0
v1.1.0-rc.1
v1.10.0
```

Tell Git that `-rc` marks a pre-release:

```bash
git -c versionsort.suffix=-rc tag -l --sort=v:refname "v1.1*"
```

**Output:**

```text
v1.1.0-rc.1
v1.1.0
v1.10.0
```

Set it permanently with `git config --global versionsort.suffix -rc` (add one line per suffix: `-alpha`, `-beta`, `-rc`).

### Maven versions

In `pom.xml`, `<version>1.5.0-SNAPSHOT</version>` means "work in progress towards 1.5.0". At release time the version becomes `1.5.0`, the commit is tagged `v1.5.0`, and development continues as `1.6.0-SNAPSHOT`. Maven's own version ordering is similar to SemVer but not identical — keep version strings simple.

## Commands

| Command | Purpose | Safety |
|---------|---------|--------|
| `git tag -l --sort=v:refname` | List tags in version order | Safe anywhere |
| `git config --global versionsort.suffix -rc` | Sort pre-releases before releases | Local configuration |
| `git describe --tags --abbrev=0` | The latest tag reachable from `HEAD` | Safe anywhere |
| `git log --oneline v1.4.2..HEAD` | Changes since the last release, to decide the next number | Safe anywhere |

## Step-by-Step Example

Deciding gradebook's next version after `v1.4.2`:

1. `git log --oneline v1.4.2..main` lists: "Add ClassReport.highest()", "Fix rounding of averages".
2. A new backward-compatible feature → MINOR: `1.5.0` (the fix rides along).
3. Release candidate first: tag `v1.5.0-rc.1`, let testers try it.
4. Final: tag `v1.5.0`; set the POM to `1.6.0-SNAPSHOT`.

## Common Mistakes

- **Breaking changes in a MINOR or PATCH release** — users' builds break on "safe" upgrades.
- **Reusing a version number** for different code.
- **Sorting tags alphabetically** in scripts (`v1.10.0` before `v1.2.0`).
- **Never leaving 0.x** — or jumping to 1.0.0 before the API is stable.

## Interview Angle

"Explain semantic versioning" — MAJOR for breaking changes, MINOR for compatible features, PATCH for compatible fixes; pre-releases like `-rc.1` sort before the release. Follow-up: "Is changing a default behaviour a breaking change?" — yes, if users rely on it.

## Recap

- MAJOR.MINOR.PATCH: breaking / feature / fix; reset lower parts on increment.
- Pre-releases (`-rc.1`) precede the release; build metadata (`+…`) is ignored.
- Tag as `vX.Y.Z`; sort with `v:refname` plus `versionsort.suffix` for pre-releases.
- Maven: `-SNAPSHOT` during development, plain version at release.

## Related Topics

- [Lightweight and Annotated Tags](../git-tags/content.md)
- [GitHub Releases and Rollback Planning](../github-releases/content.md)
- [Gitflow and Trunk-Based Development](../../team-workflows/gitflow-and-trunk-based/content.md)
