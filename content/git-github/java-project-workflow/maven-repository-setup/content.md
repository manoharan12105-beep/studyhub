# Setting Up a Maven Project Repository

**Module:** Java Project Git Workflow · **Interview priority:** Frequently asked

> [!NOTE]
> Captured in the practice lab with Maven 3.9.12, JDK 21 (compiling for Java 17) and Git 2.52 on Windows. The Maven wrapper was generated with `mvn wrapper:wrapper`.

## Learning Objectives

- Put a Maven Java project under Git with the right files tracked from the first commit.
- Write a `.gitignore` for Java, Maven and common IDEs, and keep build output out of history.
- Commit the Maven wrapper correctly, including its executable bit.

## What Is It?

A Maven project has a standard layout. Git should track the **sources of truth** and ignore everything that can be **regenerated**:

| Track | Ignore |
|-------|--------|
| `pom.xml` | `target/` (compiled classes, test reports, JARs) |
| `src/main/java`, `src/main/resources` | IDE metadata: `.idea/`, `*.iml`, `.vscode/`, `.settings/`, `.project`, `.classpath` |
| `src/test/java`, `src/test/resources` | Logs, `.env`, `application-local.properties` |
| `mvnw`, `mvnw.cmd`, `.mvn/wrapper/maven-wrapper.properties` | OS files: `.DS_Store`, `Thumbs.db` |
| `README.md`, `.gitignore`, `.gitattributes`, `LICENSE` | |

## Why It Matters

Committed `target/` folders cause merge conflicts on every build, bloat the repository with binaries and make reviews unreadable. Committed IDE files break other people's IDEs. A missing wrapper or a non-executable `mvnw` breaks CI on Linux. All of this is decided in the first commit.

## How It Works

### Before git init

After a build and opening the project in IntelliJ IDEA, the folder contains generated files:

```bash
mvn -B verify
git init
git status -s
```

**Output (`git status -s`):**

```text
?? .idea/
?? .mvn/
?? README.md
?? gradebook.iml
?? mvnw
?? mvnw.cmd
?? pom.xml
?? src/
?? target/
```

`git add .` now would commit `target/`, `.idea/` and `gradebook.iml`. Create `.gitignore` **first**:

```text
# Maven build output
target/

# IDE files
.idea/
*.iml
.vscode/
.settings/
.project
.classpath

# OS files
.DS_Store
Thumbs.db

# Logs and local configuration
*.log
.env
application-local.properties
```

**Output (`git status -s` afterwards):**

```text
?? .gitignore
?? .mvn/
?? README.md
?? mvnw
?? mvnw.cmd
?? pom.xml
?? src/
```

```bash
git add .
git commit -m "Create gradebook Maven project"
git ls-files
```

**Output (`git ls-files`):**

```text
.gitignore
.mvn/wrapper/maven-wrapper.properties
README.md
mvnw
mvnw.cmd
pom.xml
src/main/java/com/example/gradebook/App.java
src/main/java/com/example/gradebook/GradeCalculator.java
src/test/java/com/example/gradebook/GradeCalculatorTest.java
```

Confirm the rules work:

```bash
git check-ignore -v target/gradebook-1.0.0-SNAPSHOT.jar gradebook.iml
```

**Output:**

```text
.gitignore:2:target/	target/gradebook-1.0.0-SNAPSHOT.jar
.gitignore:6:*.iml	gradebook.iml
```

### The Maven wrapper

`mvnw` / `mvnw.cmd` let anyone build with the project's chosen Maven version without installing Maven. The generated configuration:

```properties
wrapperVersion=3.3.4
distributionType=only-script
distributionUrl=https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.12/apache-maven-3.9.12-bin.zip
```

Commit `mvnw`, `mvnw.cmd` and `.mvn/wrapper/maven-wrapper.properties` (older wrapper versions also have `.mvn/wrapper/maven-wrapper.jar`, which is committed too).

> [!WARNING]
> **The executable bit on Windows.** On Windows (`core.filemode=false`) Git records `mvnw` as a normal file, and `./mvnw` then fails with "Permission denied" on Linux CI runners. Captured: `git ls-files -s mvnw` showed mode `100644`. Fix it in the index:

```bash
git update-index --chmod=+x mvnw
git commit -m "Make the Maven wrapper executable"
git show --summary --format=%s HEAD
```

**Output:**

```text
Make the Maven wrapper executable

 mode change 100644 => 100755 mvnw
```

### Line endings

Add a `.gitattributes` in the same first commit, so Windows and Linux developers don't fight over line endings (see [Troubleshooting Conflicts, Ignored Files and Line Endings](../../troubleshooting/troubleshooting-conflicts-and-files/content.md)):

```text
* text=auto eol=lf
*.cmd text eol=crlf
*.jar binary
*.java diff=java
```

`*.java diff=java` also improves hunk headers and `git blame -L :method` for Java ([git blame](../../history-and-inspection/git-blame/content.md)).

## Commands

| Command | Purpose | Safety |
|---------|---------|--------|
| `git status -s` before the first `git add` | See generated files you must ignore | Safe anywhere |
| `git check-ignore -v <path>` | Confirm a rule | Safe anywhere |
| `git ls-files` | What's actually tracked | Safe anywhere |
| `git update-index --chmod=+x mvnw` | Record the executable bit | Changes local state |
| `git rm -r --cached target/` | Untrack build output that slipped in | Changes local state |

## Step-by-Step Example

1. Generate or copy the project; `mvn -B verify` to be sure it builds.
2. Write `.gitignore` and `.gitattributes` **before** `git add`.
3. `git init`, `git status -s` — only sources, POM, wrapper and docs listed.
4. `git update-index --chmod=+x mvnw` if you're on Windows.
5. `git add . && git commit -m "Create gradebook Maven project"`.
6. Clone it into another folder and run `./mvnw -B verify` — proves the repository is complete.

## Common Mistakes

- **Committing `target/` or `*.class`** — untrack with `git rm -r --cached target/`.
- **Committing `.idea/` wholesale** — personal settings and absolute paths break teammates. (Some teams share a curated subset such as code style; do it deliberately.)
- **Forgetting the wrapper files** or the executable bit.
- **Committing `application-local.properties` with passwords** — see [Spring Boot Repository Collaboration](../spring-boot-repository-collaboration/content.md).

## Interview Angle

"What should be in a Java project's `.gitignore`?" — `target/`/build output, IDE files, logs, local config and secrets; never ignore `pom.xml`, `src/` or the wrapper. Bonus: the wrapper's executable bit from Windows and `.gitattributes` for line endings.

## Recap

- Track sources, POM, wrapper, docs; ignore everything Maven or the IDE regenerates.
- Write `.gitignore` before the first `git add`.
- Commit `mvnw` as executable (`git update-index --chmod=+x`).
- A fresh clone must build with `./mvnw -B verify`.

## Related Topics

- [.gitignore and Tracking Files](../../configuration-and-repositories/gitignore-and-tracking/content.md)
- [The Git Practice Lab](../../vcs-fundamentals/git-practice-lab/content.md)
- [Java Feature Branch Workflow](../java-feature-branch-workflow/content.md)
