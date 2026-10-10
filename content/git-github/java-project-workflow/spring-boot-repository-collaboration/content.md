# Spring Boot Repository Collaboration, Configuration Secrets and Interview-Ready Repositories

**Module:** Java Project Git Workflow · **Interview priority:** Frequently asked

> [!NOTE]
> The ignore rules and history scan were run in the practice lab. Spring Boot behaviour (property placeholders with defaults, profile-specific files) is standard Spring Boot externalized configuration; see the Spring Boot subject for depth.

## Learning Objectives

- Split Spring Boot configuration into a committed, secret-free part and ignored local parts.
- Collaborate on a Spring Boot repository without leaking credentials or overwriting teammates' local settings.
- Prepare a repository that makes a good impression in a technical interview.

## What Is It?

A Spring Boot application reads configuration from `application.properties` (or `.yml`), profile files such as `application-local.properties`, environment variables and more. The Git question is **which of these belong in the repository**:

| File / source | In Git? | Contains |
|---------------|---------|----------|
| `src/main/resources/application.properties` | Yes | Defaults and **placeholders** like `${DB_PASSWORD}` — never real secrets |
| `application-local.properties` | No (ignored) | A developer's local overrides |
| `.env` | No (ignored) | Local environment values |
| `.env.example` / `application-example.properties` | Yes | Variable names with fake values (`change-me`) |
| Environment variables / secret manager / CI secrets | Not files | Real credentials in each environment |

## Why It Matters

Spring Boot projects are the most common place students leak database passwords and API keys to public GitHub repositories. A clean configuration split also prevents the daily annoyance of teammates committing their own local database URLs over each other.

## How It Works

### Committed configuration with placeholders

```properties
spring.application.name=gradebook
spring.datasource.url=${DB_URL:jdbc:postgresql://localhost:5432/gradebook}
spring.datasource.username=${DB_USERNAME:gradebook}
spring.datasource.password=${DB_PASSWORD}
```

`${NAME:default}` takes the environment variable or property `NAME` and falls back to the default; `${DB_PASSWORD}` has **no** default, so the application fails fast if the password isn't provided — better than a silent hard-coded one.

### Local, ignored overrides

`.gitignore` entries (from [Setting Up a Maven Project Repository](../maven-repository-setup/content.md)):

```text
.env
application-local.properties
```

```bash
git status -s
git check-ignore -v src/main/resources/application-local.properties .env
```

**Output:**

```text
?? .env.example
?? src/main/resources/
.gitignore:19:application-local.properties	src/main/resources/application-local.properties
.gitignore:18:.env	.env
```

Only `.env.example` and the committed `application.properties` (inside the untracked `src/main/resources/`) will be added; the local files are ignored. Running with the `local` profile (`SPRING_PROFILES_ACTIVE=local` or `--spring.profiles.active=local`) makes Spring Boot load `application-local.properties` on top of the defaults.

`.env.example` documents what each developer must set:

```text
DB_PASSWORD=change-me
```

### Team rules that prevent collisions

- Shared defaults change through PRs; personal settings stay in ignored files.
- A new required property is added to `application.properties` (as a placeholder) **and** to `.env.example` in the same PR.
- CI and deployment get real values from their secret stores (GitHub Actions secrets, the server environment) — DevOps: [Configuration and Secrets](../../../devops/production-readiness/configuration-and-secrets/content.md).
- Never use `git update-index --assume-unchanged` to hide local edits to a tracked config file; split the file instead.

### If a secret was committed anyway

Rotate it first, then remove it from the code and ignore the file — the full response is in [Secrets in Git History](../../authentication-and-security/secrets-in-git-history/content.md). Scan history before making a repository public:

```bash
git log --all --oneline -G "(password|secret|token)[[:space:]]*=[[:space:]]*[^\$[:space:]]"
```

No output (as in the lab) means no added or removed line assigned a literal value to those keys; it's a quick check, not a guarantee — GitHub's secret scanning is more thorough.

## Preparing a Repository for a Technical Interview

Interviewers and recruiters open your GitHub repositories. What they notice, in order:

| Check | What good looks like |
|-------|----------------------|
| README | What it does, tech stack, how to run (`./mvnw spring-boot:run`), how to test, screenshots or sample requests |
| It builds | A fresh clone passes `./mvnw -B verify`; a CI badge shows green |
| History | Meaningful commit messages; no "asdf", "final final"; feature work visible through merged PRs |
| Hygiene | No `target/`, IDE files, secrets or personal data; `.gitignore` present |
| Structure | Packages by feature or layer, tests next to code, configuration placeholders |
| Releases | A tag such as `v1.0.0` for the version you'd demo |
| Licence and description | Repository description, topics (`java`, `spring-boot`), a licence |

Before sharing, run: `git ls-files` (anything that shouldn't be there?), the history scan above, a fresh clone + build, and read your own README as a stranger would. Pin your best two or three repositories on your profile.

> [!TIP]
> Don't rewrite years of history to look perfect. Clean up **unpushed** branches with interactive rebase, and let your recent, well-structured PRs speak for your current habits.

## Commands

| Command | Purpose | Safety |
|---------|---------|--------|
| `git check-ignore -v <path>` | Confirm local config is ignored | Safe anywhere |
| `git ls-files` | Review what a viewer will see | Safe anywhere |
| `git log --all -G "<regex>"` | Scan history for suspicious assignments | Safe anywhere |
| `git clone <url> /tmp/check && ./mvnw -B verify` | Prove the repository builds from scratch | Safe |

## Step-by-Step Example

1. Move the real password out of `application.properties` into `DB_PASSWORD`; add `.env.example`.
2. Ignore `.env` and `application-local.properties`; confirm with `git check-ignore -v`.
3. If the password was ever committed: rotate it.
4. Update README: required environment variables and run commands.
5. Commit, push, open a PR; CI runs with the secret from GitHub Actions secrets.

## Common Mistakes

- **Real passwords in `application.properties`** "because it's just the dev database".
- **Committing `application-local.properties`** and overwriting teammates' settings.
- **Defaults that are real credentials** (`${DB_PASSWORD:S3cret!}`).
- **A portfolio repository that doesn't build** from a fresh clone.

## Interview Angle

"How do you manage configuration and secrets in a Spring Boot project with Git?" — committed defaults with placeholders, ignored local profile files, example files for documentation, real values from environment/secret stores, rotation if leaked. "What do you check before sharing a project for an interview?" — README, clean build from a clone, history, hygiene, tags.

## Recap

- Commit configuration structure and placeholders; never real secrets.
- Ignore `.env` and `application-local.properties`; commit `.env.example`.
- Real values come from the environment, CI secrets or a secret manager.
- An interview-ready repository builds from a clone, explains itself and has a clean, honest history.

## Related Topics

- [Secrets in Git History](../../authentication-and-security/secrets-in-git-history/content.md)
- [Setting Up a Maven Project Repository](../maven-repository-setup/content.md)
- [Creating a GitHub Repository and Writing a README](../../github-fundamentals/creating-github-repositories/content.md)
