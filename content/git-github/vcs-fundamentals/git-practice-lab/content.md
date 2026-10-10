# The Git Practice Lab and the gradebook Project

**Module:** Version Control Fundamentals · **Interview priority:** Awareness

## Learning Objectives

- Create the disposable practice folder that every example and lab in this subject uses.
- Know the gradebook sample project, the people in the examples and the stand-in "remote".
- Follow the safety rules for practising commands that can destroy work.

## What Is It?

Every runnable example in Git & GitHub Mastery assumes the same **practice lab**:

| Item | Value |
|------|-------|
| Practice folder | `~/git-lab` (shown as `/home/student/git-lab` in output) |
| Sample project | `gradebook` — a small Java 17 Maven project that averages marks and assigns letter grades |
| You | Priya Sharma, `priya@example.com` |
| Teammate | Arjun Mehta, `arjun@example.com` (simulated with a second clone) |
| Stand-in remote | A **bare repository** at `~/git-lab/remotes/gradebook.git`, used wherever a lesson needs "GitHub" but must run offline |
| Default branch | `main` |

On Windows, run every command in **Git Bash**.

## Why It Matters

Git commands such as `reset --hard`, `clean -f`, `rebase` and `push --force` can destroy work. Practising them in a throwaway folder means a mistake costs nothing — you delete `~/git-lab` and run the setup again. Using one shared project also means each lesson can build on the last.

## How It Works

```text
~/git-lab/
├── gradebook/                 ← your working repository (created by the labs)
├── remotes/gradebook.git      ← bare repository standing in for GitHub
└── arjun/gradebook/           ← the teammate's clone (created when a lesson needs it)
```

A **bare repository** has no working files — only the Git database. Hosting services store repositories this way. Pushing to and fetching from a bare folder on your own disk uses exactly the same Git commands as GitHub, so remote lessons can show real output without a network or an account. GitHub-specific steps (pull requests, releases, settings) are marked **Instruction only**.

## The gradebook Project

```text
gradebook/
├── pom.xml
├── README.md
└── src/
    ├── main/java/com/example/gradebook/
    │   ├── App.java
    │   └── GradeCalculator.java
    └── test/java/com/example/gradebook/
        └── GradeCalculatorTest.java
```

`GradeCalculator.average(int...)` averages marks (and rejects an empty list); `letterGrade(double)` returns A for 90+, B for 75+, C for 60+ and F below that. Building it needs JDK 17+ and Maven 3.9+, but **most Git lessons never build it** — Git only sees files.

```bash
# Only needed for the Java-workflow lessons
mvn -B verify
java -cp target/classes com.example.gradebook.App
```

**Output (last command):**

```text
Average: 83.33, grade: B
```

## Setup Script

Run this once (and again whenever you want a fresh start). It creates the project files but does **not** create a repository — the first labs do that.

```bash
# Creates ~/git-lab/gradebook with the sample project (no Git repository yet).
set -e
rm -rf ~/git-lab/gradebook ~/git-lab/remotes ~/git-lab/arjun
mkdir -p ~/git-lab/gradebook && cd ~/git-lab/gradebook
mkdir -p src/main/java/com/example/gradebook src/test/java/com/example/gradebook

cat > pom.xml <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>

  <groupId>com.example</groupId>
  <artifactId>gradebook</artifactId>
  <version>1.0.0-SNAPSHOT</version>

  <properties>
    <maven.compiler.release>17</maven.compiler.release>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
  </properties>

  <dependencies>
    <dependency>
      <groupId>org.junit.jupiter</groupId>
      <artifactId>junit-jupiter</artifactId>
      <version>5.11.4</version>
      <scope>test</scope>
    </dependency>
  </dependencies>

  <build>
    <plugins>
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-surefire-plugin</artifactId>
        <version>3.5.2</version>
      </plugin>
    </plugins>
  </build>
</project>
EOF

cat > src/main/java/com/example/gradebook/GradeCalculator.java <<'EOF'
package com.example.gradebook;

public class GradeCalculator {

    /** Average of the marks; an empty list is an error, not a zero. */
    public double average(int... marks) {
        if (marks.length == 0) {
            throw new IllegalArgumentException("at least one mark is required");
        }
        int total = 0;
        for (int mark : marks) {
            total += mark;
        }
        return (double) total / marks.length;
    }

    /** A for 90+, B for 75+, C for 60+, F below 60. */
    public char letterGrade(double average) {
        if (average >= 90) return 'A';
        if (average >= 75) return 'B';
        if (average >= 60) return 'C';
        return 'F';
    }
}
EOF

cat > src/main/java/com/example/gradebook/App.java <<'EOF'
package com.example.gradebook;

public class App {
    public static void main(String[] args) {
        GradeCalculator calculator = new GradeCalculator();
        double average = calculator.average(82, 91, 77);
        System.out.printf("Average: %.2f, grade: %c%n", average, calculator.letterGrade(average));
    }
}
EOF

cat > src/test/java/com/example/gradebook/GradeCalculatorTest.java <<'EOF'
package com.example.gradebook;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class GradeCalculatorTest {

    private final GradeCalculator calculator = new GradeCalculator();

    @Test
    void averagesMarks() {
        assertEquals(83.33, calculator.average(82, 91, 77), 0.01);
    }

    @Test
    void rejectsEmptyMarks() {
        assertThrows(IllegalArgumentException.class, () -> calculator.average());
    }

    @Test
    void mapsAverageToLetter() {
        assertEquals('A', calculator.letterGrade(90));
        assertEquals('B', calculator.letterGrade(89.9));
        assertEquals('F', calculator.letterGrade(59.9));
    }
}
EOF

cat > README.md <<'EOF'
# gradebook

Calculates average marks and letter grades for a class.

## Build

    mvn -B verify

## Run

    java -cp target/classes com.example.gradebook.App
EOF

echo "gradebook created in $(pwd)"
```

To create the stand-in remote when a lesson asks for it:

```bash
git init --bare ~/git-lab/remotes/gradebook.git
```

## Conventions Used in Every Lesson

- Commands appear in `bash` blocks **without a prompt**, run from `~/git-lab/gradebook` unless stated.
- `**Output:**` blocks were **captured from real runs** of Git 2.52 in this lab. Your commit hashes, dates and times will differ (they depend on the author, time and content), and paths are shown as `/home/student/git-lab`.
- `**Output (varies):**` marks output that depends on your machine (versions, sizes).
- `**Expected result:**` describes steps that were not run — anything that needs a GitHub account, the web interface or SSH keys.
- Each command lesson labels commands: **Safe anywhere** (read-only), **Changes local state**, **Practice repository first** (can lose work or rewrite history), **Changes the remote**.

## Safety Rules

> [!CAUTION]
> Run commands marked **Practice repository first** only inside `~/git-lab` until you understand them. `git reset --hard`, `git clean -f`, `git checkout -- <file>`, `git restore <file>`, `git stash drop`, `git branch -D` and `git push --force` can permanently delete uncommitted work or rewrite shared history.

1. Before any risky command, inspect: `git status`, `git log --oneline --graph --all -10`, `git stash list`.
2. Make a safety branch first: `git branch backup/before-reset`. It costs nothing and is easy to delete later.
3. Never practise `push --force` against a real shared repository.
4. Never use real tokens, passwords or keys in exercises. StudyHub never asks for credentials — do not paste them into any page.

> [!NOTE]
> StudyHub is a static website: it **cannot** see your files or run Git. The interactive repository and branch visualizers are **simulations** with fixed rules. Run real commands in your own terminal.

## Resetting the Lab

```bash
rm -rf ~/git-lab
```

Then run the setup script again.

> [!WARNING]
> Check the path twice before running `rm -rf`. It deletes without asking and cannot be undone. Only ever point it at `~/git-lab`.

## Recap

- One practice folder, one sample project, one stand-in remote, two people.
- Captured output is real; hashes and dates on your machine differ.
- Risky commands are practised only in `~/git-lab`, after inspecting state and making a backup branch.

## Related Topics

- [Installing Git and Getting Help](../installing-git/content.md)
- [Lab 01 — Create a Repository and Make Meaningful Commits](../../labs/git-lab-01-first-repository/content.md)
- [Setting Up a Maven Project Repository](../../java-project-workflow/maven-repository-setup/content.md)
