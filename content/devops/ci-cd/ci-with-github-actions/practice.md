# CI with GitHub Actions — Practice

### P1. Where do workflows live?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** workflow files

Where must a GitHub Actions workflow file be stored?

- A) `.github/actions/ci.yml`
- B) `.github/workflows/ci.yml`
- C) `ci/workflow.yml`
- D) The repository settings page

<details>
<summary>Answer</summary>

**Answer:** B) `.github/workflows/ci.yml`

</details>

### P2. Triggers

**Difficulty:** Easy · **Type:** CI/CD · **Concepts:** on

Write the `on:` section that runs a workflow for pushes to `main`, for every pull request, and manually from the Actions tab.

<details>
<summary>Answer</summary>

```yaml
on:
  push:
    branches: [main]
  pull_request:
  workflow_dispatch:
```

</details>

### P3. Set up Java

**Difficulty:** Easy · **Type:** CI/CD · **Concepts:** setup-java

Write the step that installs Temurin JDK 21 with Maven caching.

<details>
<summary>Answer</summary>

```yaml
- uses: actions/setup-java@v6
  with:
    distribution: temurin
    java-version: '21'
    cache: maven
```

</details>

### P4. Order the steps

**Difficulty:** Easy · **Type:** CI/CD · **Concepts:** step order

Order: `./mvnw -B verify`, `actions/setup-java`, `docker build`, `actions/checkout`.

<details>
<summary>Answer</summary>

`actions/checkout` → `actions/setup-java` → `./mvnw -B verify` → `docker build`.

</details>

### P5. Forgot the checkout

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** fresh runners

A job's first step is `run: ./mvnw -B verify` and it fails with `No such file or directory`. Why?

<details>
<summary>Answer</summary>

The runner starts empty; the repository is not there until `actions/checkout` runs. Add it as the first step.

</details>

### P6. Database for tests

**Difficulty:** Medium · **Type:** CI/CD · **Concepts:** service containers

Write a `services` section that starts `postgres:18` with database `taskdb`, user `taskapp`, password `ci-only-password`, reachable on `localhost:5432`, and waits until it is ready.

<details>
<summary>Answer</summary>

```yaml
services:
  postgres:
    image: postgres:18
    env:
      POSTGRES_DB: taskdb
      POSTGRES_USER: taskapp
      POSTGRES_PASSWORD: ci-only-password
    ports:
      - 5432:5432
    options: >-
      --health-cmd "pg_isready -U taskapp -d taskdb"
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
```

</details>

### P7. Keep the reports

**Difficulty:** Medium · **Type:** CI/CD · **Concepts:** artifacts, conditions

Write a step that uploads `target/surefire-reports` as an artifact named `test-reports`, only when an earlier step failed.

<details>
<summary>Answer</summary>

```yaml
- if: failure()
  uses: actions/upload-artifact@v7
  with:
    name: test-reports
    path: target/surefire-reports
```

</details>

### P8. Permission denied

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** executable bit

CI fails at `./mvnw -B verify` with `Permission denied`. Write the fix.

<details>
<summary>Answer</summary>

```bash
# Illustrative: in your local repository
git update-index --chmod=+x mvnw
git commit -m "build: make mvnw executable"
git push
```

</details>

### P9. Gate the merge

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** branch protection

A teammate merged a pull request while CI was red, and production broke after deployment. Which two settings or workflow changes prevent this?

<details>
<summary>Answer</summary>

Branch protection on `main` requiring the CI status check to pass (and requiring pull requests); and making the deploy job depend on the test job (`needs`) so a red build never produces a deployment.

</details>

### P10. Predict the run

**Difficulty:** Hard · **Type:** Output · **Concepts:** triggers and conditions

The workflow has `on: push: branches: [main]` and `pull_request`, and the `publish` job has `if: github.event_name == 'push' && github.ref == 'refs/heads/main'`. Which jobs run for (a) a pull request, (b) a push to `feature/x`, (c) a merge into `main`?

<details>
<summary>Answer</summary>

(a) `test` only — `publish` is skipped by its condition. (b) Nothing — pushes to other branches do not trigger the workflow (the pull request event covers them once a PR is open). (c) `test`, then `publish` (and `deploy` after it).

</details>
