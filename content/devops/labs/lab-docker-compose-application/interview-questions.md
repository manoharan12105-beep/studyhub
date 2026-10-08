# Lab 09 — Interview Questions

## Beginner

### Q1. Which resources does `docker compose up -d` create for a project?

**Style:** What

<details>
<summary>Answer</summary>

A default network (`<project>_default`), the named volumes declared in the file (`<project>_pgdata`) and one container per service (`<project>-db-1`, `<project>-app-1`), then starts them in dependency order.

</details>

## Intermediate

### Q2. What does `docker compose config` do and why run it?

**Style:** Why

<details>
<summary>Answer</summary>

It validates the Compose file and prints the effective configuration with all `${…}` variables interpolated, so you catch syntax errors, missing variables and wrong values before starting anything. Its output can contain secrets.

</details>

### Q3. The app container runs old code after you edited a Java file and ran `docker compose up -d`. Why?

**Style:** Debugging

<details>
<summary>Answer</summary>

Compose ran the existing `taskapi:local` image; nothing rebuilt it. Rebuild (`docker build -t taskapi:local .`, or add `build: .` and use `docker compose up -d --build`) and then `up -d` recreates the container from the new image.

</details>
