# Lab 15 — GitHub Actions CI

**Lab:** 15 · **Module:** CI with GitHub Actions · **Verification:** Partly tested

> [!NOTE]
> Needs a GitHub repository. **Partly tested:** `./mvnw -B verify` was run against PostgreSQL 18 configured through the same environment variables as the workflow (3 tests passed), and the workflow file was validated against the GitHub Actions workflow schema. The workflow was not run on GitHub when this lab was written.

## Objective

Push the Task API to GitHub and make every push and pull request build the code, run the tests against a PostgreSQL service container and check that the Docker image builds.

## Prerequisites

- The Task API project with `mvnw` committed; a GitHub account.
- Lesson: [CI with GitHub Actions](../../ci-cd/ci-with-github-actions/content.md).

## Scenario

A teammate merged code that did not compile. From now on, no change reaches `main` without a green build.

## Steps

### Step 1: Put the project on GitHub

```bash
git init -b main
git add .
git status --short          # check: no .env, no target/
git commit -m "Task API"
git remote add origin git@github.com:your-user/taskapi.git
git push -u origin main
```

If you work on Windows, mark the wrapper executable before pushing:

```bash
git update-index --chmod=+x mvnw
git commit -m "build: make mvnw executable"
```

### Step 2: Add the workflow

Create `.github/workflows/pipeline.yml` with the `name`, `on` and `jobs.test` sections from the [CI lesson](../../ci-cd/ci-with-github-actions/content.md) (the `publish` and `deploy` jobs come in Labs 16 and 17).

```bash
git add .github/workflows/pipeline.yml
git commit -m "ci: build and test on every push"
git push
```

### Step 3: Watch the run

Open the repository's **Actions** tab.

**Expected result:** a run named after your commit. Inside the `test` job: *Initialize containers* (PostgreSQL starts and becomes healthy), *Check out the code*, *Set up JDK 21*, *Build and run tests* — whose log contains `Tests run: 3, Failures: 0, Errors: 0, Skipped: 0` and `BUILD SUCCESS` — and *Check that the Docker image builds*. The commit gets a green check.

### Step 4: Break a test on purpose

On a branch, change the expected title in `TaskApiApplicationTests` to `"Wrong"`, push and open a pull request.

**Expected result:** the run fails at *Build and run tests*; the *Keep test reports when tests fail* step uploads `test-reports` (download it from the run's summary page); the pull request shows a red ✗.

### Step 5: Protect main

Settings → Branches (or Rules) → add a rule for `main`: require a pull request and require the status check `test` to pass. Fix the test, push, watch the check turn green, merge.

## Verification Checklist

- ☐ A push to `main` runs the workflow and passes.
- ☐ A failing test makes the run and the pull request red, and test reports are downloadable.
- ☐ `main` requires the `test` check.

## Common Mistakes

- `./mvnw: Permission denied` (executable bit lost on Windows).
- A different database name/user in the service and in `SPRING_DATASOURCE_*`.
- Committing `target/` or `.env`.

## Troubleshooting

| Failure in the log | Fix |
|--------------------|-----|
| `Permission denied` on `./mvnw` | `git update-index --chmod=+x mvnw`, commit, push |
| `Connection to localhost:5432 refused` | The `services` block is missing or its `ports` mapping is wrong |
| `password authentication failed` | Service `POSTGRES_PASSWORD` ≠ `SPRING_DATASOURCE_PASSWORD` |
| Docker build step fails, tests pass | `Dockerfile` or `.dockerignore` problem — reproduce with `docker build .` locally |
