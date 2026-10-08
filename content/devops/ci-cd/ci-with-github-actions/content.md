# CI with GitHub Actions

**Module:** CI/CD · **Interview priority:** Core

## What Is It?

**Continuous Integration (CI)** means every change pushed to the shared repository is automatically built and tested, so problems are found minutes after they are introduced. **GitHub Actions** is GitHub's built-in automation service: YAML **workflow** files in `.github/workflows/` describe what to run on GitHub-hosted machines (**runners**) when something happens in the repository.

```text
git push / pull request
   │
   ▼
GitHub Actions ── job "test" on ubuntu-latest ─────────────────────────────┐
   │  service container: postgres:18                                        │
   ├─ Checkout ──► Set up JDK 21 ──► ./mvnw -B verify ──► docker build      │
   │                                   (compile, unit + integration tests)   │
   └────────────── ✓ green check / ✗ red cross on the commit and the PR ────┘
```

## Why It Matters

- A failing test blocks a bad change before it is merged or deployed.
- The build runs in a clean environment, so "works on my machine" problems (an uncommitted file, a local-only dependency) show up immediately.
- The CI workflow is the first half of the CD pipeline; deployment only ever takes images that passed it.

## How It Works

| Term | Meaning |
|------|---------|
| **Workflow** | A YAML file in `.github/workflows/`; one repository can have several |
| **Trigger** (`on`) | Events that start it: `push`, `pull_request`, `workflow_dispatch` (manual button), `schedule` |
| **Job** | A set of steps on one runner; jobs run in parallel unless `needs:` orders them |
| **Runner** | The machine: `ubuntu-latest` is a fresh GitHub-hosted Linux VM with Docker installed |
| **Step** | Either `uses:` (a reusable **action**) or `run:` (shell commands) |
| **Service container** | A container started next to the job (here PostgreSQL for the integration tests) |
| **Artifact** | A file saved from a run (test reports, a JAR) to download later |

Each job starts on a **new, empty** VM: nothing carries over from previous runs except what you cache or upload.

## The CI Workflow

`.github/workflows/pipeline.yml` (the `test` job; the next lessons add `publish` and `deploy` jobs to the same file). The complete file was validated against the GitHub workflow schema:

```yaml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:18
        env:
          POSTGRES_DB: taskdb
          POSTGRES_USER: taskapp
          # Not a secret: a throwaway database that exists only during this job.
          POSTGRES_PASSWORD: ci-only-password
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U taskapp -d taskdb"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    env:
      SPRING_DATASOURCE_URL: jdbc:postgresql://localhost:5432/taskdb
      SPRING_DATASOURCE_USERNAME: taskapp
      SPRING_DATASOURCE_PASSWORD: ci-only-password

    steps:
      - name: Check out the code
        uses: actions/checkout@v7

      - name: Set up JDK 21
        uses: actions/setup-java@v6
        with:
          distribution: temurin
          java-version: '21'
          cache: maven

      - name: Build and run tests
        run: ./mvnw -B verify

      - name: Keep test reports when tests fail
        if: failure()
        uses: actions/upload-artifact@v7
        with:
          name: test-reports
          path: target/surefire-reports

      - name: Check that the Docker image builds
        run: docker build -t taskapi:${{ github.sha }} .
```

### Line by line

| Part | What it does |
|------|--------------|
| `on: push: branches: [main]` + `pull_request` | Runs for pushes to `main` and for every pull request |
| `runs-on: ubuntu-latest` | A fresh Linux VM per run |
| `services: postgres` | Starts PostgreSQL 18 beside the job; `ports: 5432:5432` makes it `localhost:5432` for the job's steps |
| `options: --health-cmd …` | The job waits until PostgreSQL is healthy before the steps start |
| Job-level `env` | The Spring datasource variables, read by the tests |
| `actions/checkout@v7` | Clones the repository at the commit being tested |
| `actions/setup-java@v6` with `cache: maven` | Installs Temurin JDK 21 and caches `~/.m2` keyed on `pom.xml` |
| `./mvnw -B verify` | Maven Wrapper in batch mode: compile, unit tests, integration tests, package |
| `if: failure()` + `upload-artifact` | Saves Surefire reports only when something failed |
| `docker build -t taskapi:${{ github.sha }}` | Proves the Dockerfile still builds; the commit SHA is the tag |

`${{ … }}` is an **expression** evaluated by GitHub before the step runs; `github.sha` is the commit being built.

### What was tested locally

The same Maven command, `./mvnw -B verify`, was run against a PostgreSQL 18 server configured through the same three `SPRING_DATASOURCE_*` variables: it compiled the project and ran the Task API's three tests (`Tests run: 3, Failures: 0, Errors: 0, Skipped: 0`). The workflow file itself was validated against the GitHub Actions workflow JSON Schema; it has not been executed on GitHub as part of writing this lesson.

## Checkout, Java Setup and Maven

- The **Maven Wrapper** (`mvnw`, `.mvn/wrapper/`) pins the Maven version; commit it. Spring Initializr generates it.
- `-B` (batch mode) gives clean, non-interactive logs.
- `verify` runs the full lifecycle up to integration tests; `package` would stop earlier, `install` is unnecessary in CI.

## Tests

- Unit tests need nothing; integration tests (`@SpringBootTest`) need PostgreSQL — the service container provides a real one, closer to production than an in-memory database.
- A test failure makes `mvnw` exit non-zero, which fails the step, the job and the workflow: the commit gets a red ✗ and, with branch protection, the pull request cannot be merged.
- Alternative: **Testcontainers** starts PostgreSQL from the tests themselves (works on GitHub runners because Docker is installed).

## Artifacts

Artifacts are files kept after the run (for a limited retention period). Typical uses: test reports for debugging failures, a built JAR, coverage reports. For deployment, the real artifact of this pipeline is the **Docker image**, which is stored in a registry, not as an Actions artifact ([Container Registry](../container-registry/content.md)).

## Docker Build in CI

Building the image in CI catches a broken `Dockerfile` before deployment. The runner already has Docker. In the next lesson the build is done with `docker/build-push-action` and pushed to a registry.

## Branch Protection

In the repository's settings, protect `main`: require pull requests and require the `test` check to pass. Then nothing reaches `main` — and therefore production — without a green CI run.

## Production Relevance

- CI is the quality gate of the whole delivery process: the deploy job runs only after `test` succeeds.
- A fast CI (cached dependencies, parallel jobs) keeps developers using it; a 30-minute CI gets ignored.

## Common Mistakes

- `./mvnw: Permission denied` — the wrapper lost its executable bit (committed from Windows). Fix: `git update-index --chmod=+x mvnw`, commit, push.
- Tests that pass locally only because of local state (a database you created by hand, files in your home folder).
- Secrets written into the workflow file instead of `${{ secrets.NAME }}`.
- Running `mvn install` or skipping tests in CI "to make it green".
- Using `@main` or no version for third-party actions — pin a major version (or a commit SHA).

## Interview Angle

- Describe your CI: trigger, runner, service container, steps, what fails the build.
- Explain jobs vs steps, `uses` vs `run`, and how jobs share data (artifacts, outputs, registries).
- Explain why integration tests use a real PostgreSQL service container.

## Key Takeaways

- A workflow = triggers + jobs; a job = a fresh runner + steps; a step = an action (`uses`) or a command (`run`).
- `checkout` → `setup-java` (with Maven cache) → `./mvnw -B verify` against a PostgreSQL service container → `docker build`.
- A failing step fails the workflow and blocks the pull request when branch protection requires the check.
- Keep the workflow fast, pinned and free of secrets.
