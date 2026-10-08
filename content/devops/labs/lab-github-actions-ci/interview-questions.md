# Lab 15 — Interview Questions

## Beginner

### Q1. What happens in your CI when someone pushes a commit?

**Style:** How

<details>
<summary>Answer</summary>

GitHub starts a fresh Ubuntu runner, starts a PostgreSQL 18 service container and waits for it to be healthy, checks out the commit, installs JDK 21 with the Maven cache, runs `./mvnw -B verify` (compile, tests against the database, package) and builds the Docker image. Any failing step marks the commit red.

</details>

## Intermediate

### Q2. Why is the database password written in the workflow file acceptable here?

**Style:** Trap

<details>
<summary>Answer</summary>

It protects a throwaway database that exists only inside the job's runner and is destroyed afterwards; it grants access to nothing real. Real credentials (registry tokens, deploy keys, production passwords) always go into GitHub Secrets.

</details>

### Q3. How do you debug a test that fails only in CI?

**Style:** Debugging

<details>
<summary>Answer</summary>

Download the uploaded Surefire reports for the stack trace; compare the environment (database version, variables, time zone, locale, file paths, test order); reproduce locally with the same Docker image of PostgreSQL and the same variables; check for tests depending on local state or on each other's data.

</details>
