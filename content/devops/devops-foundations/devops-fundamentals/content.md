# DevOps Fundamentals

**Module:** DevOps Foundations · **Interview priority:** Core

## What Is It?

**DevOps** is a way of building and running software in which the people who write the code also own how it is built, tested, released and operated — with as much of that work automated as possible. It is a set of practices and a culture, not a tool or a job title.

For a Java backend developer, DevOps answers one question: *how does the code on my laptop become a running, healthy service that real users can reach — and how does the next change get there safely?*

```text
Laptop              Shared repository        Automation              Server
──────              ─────────────────        ──────────              ──────
write code   ──►    git push         ──►     build, test,     ──►    run the new version,
run tests           review (PR)              package image           watch logs and health
```

## Why It Matters

- Code that is not deployed delivers no value. Interviewers increasingly ask "how did you deploy your project?" and expect more than "I ran it in IntelliJ".
- Manual deployments are slow and error-prone: someone forgets a step, copies the wrong JAR, or edits a server by hand that nobody can rebuild.
- Small, frequent, automated releases are *safer* than big, rare, manual ones — each change is small enough to understand and to roll back.

## Development vs Operations

Before DevOps, two teams pulled in opposite directions:

| | Development (Dev) | Operations (Ops) |
|---|---|---|
| Goal | Ship features quickly | Keep production stable |
| Measured on | Features delivered | Uptime, incidents |
| Typical complaint | "Ops is slow to deploy" | "Dev throws broken code over the wall" |

DevOps joins the goals: the team that builds a service is responsible for running it ("you build it, you run it"), and both speed and stability come from automation, small changes and fast feedback.

## The DevOps Lifecycle

```text
        ┌──────── plan ◄──────── monitor ◄────────┐
        ▼                                          │
      code ──► build ──► test ──► release ──► deploy ──► operate
```

| Stage | What happens | Tools in this subject |
|-------|--------------|-----------------------|
| Plan | Decide the change | Issues, pull requests |
| Code | Write and review it | Git, GitHub |
| Build | Compile and package | Maven, Docker |
| Test | Prove it works | JUnit, Spring Boot tests, CI |
| Release | Produce a versioned artifact | Docker image in a registry |
| Deploy | Run it in an environment | SSH, Docker Compose |
| Operate | Keep it running | Nginx, restart policies, firewall |
| Monitor | Know when something is wrong | Logs, health checks, uptime checks |

The loop matters: what you learn from monitoring (errors, slow endpoints) feeds the next plan.

## CI vs CD vs Continuous Deployment

| Practice | Every change… | Ends with |
|----------|---------------|-----------|
| **Continuous Integration (CI)** | is merged often and automatically built and tested | A green (or red) build |
| **Continuous Delivery** | is also packaged into a release that *could* go to production at any time | A deployable artifact; a human clicks "deploy" |
| **Continuous Deployment** | that passes the pipeline goes to production automatically | A live change, with no manual step |

> [!WARNING]
> **Common trap:** "CD" is ambiguous. Say which one you mean: continuous *delivery* keeps a manual approval before production; continuous *deployment* removes it.

## Infrastructure and Application Deployment

Two different things get "deployed":

| | Infrastructure | Application |
|---|---|---|
| What | Servers, networks, firewall rules, DNS records, databases | Your code: a JAR or a Docker image |
| Changes | Rarely | Many times a day or week |
| In this subject | A Linux VPS, Docker, Nginx, a domain | The Spring Boot image deployed with Docker Compose |

At large scale infrastructure is also written as code (Terraform, Ansible). In this subject the infrastructure is one server prepared by hand, carefully documented — and everything about the *application* is automated.

## Why Automation Matters

| Manual | Automated |
|--------|-----------|
| "It worked when I did it" | Same steps every time |
| Steps live in someone's head | Steps live in Git (`Dockerfile`, `compose.yaml`, workflow YAML) |
| Slow, so releases are big | Fast, so releases are small |
| A mistake is noticed in production | A failing test stops the pipeline |

Rule of thumb: if you do it twice and it can break, script it.

## Immutable Infrastructure Basics

An **immutable** artifact is never changed after it is built. To change the application you build a *new* image and replace the running container; you never SSH in and edit files inside it.

```text
Mutable (avoid)                         Immutable (prefer)
server: edit app.jar, restart           build image taskapi:4f2c1a9 → run it
next fix: edit again …                  next fix: build taskapi:9b7e3d0 → replace
nobody knows what is on the server      the image tag says exactly what runs
```

Benefits: every environment runs the same bits, rollback is "run the previous tag", and a lost server can be rebuilt from Git and the registry.

## Environment Separation

| Environment | Purpose | Data | Who uses it |
|-------------|---------|------|-------------|
| Development | Write and debug code | Fake, local | You |
| Testing (CI) | Automated tests on every change | Throwaway, created per run | The pipeline |
| Staging | A production-like rehearsal | Realistic copy, no real users | Team, testers |
| Production | Real users | Real, must be protected | Customers |

The **same image** moves through the environments; only **configuration** changes (database URL, credentials, log level). That is why the next lessons insist on environment variables instead of values baked into the code.

## Example

A Spring Boot developer's change, end to end, as this subject builds it:

```text
1. Fix a bug in TaskController, run tests locally          (develop)
2. git push → pull request                                  (code review)
3. GitHub Actions: mvn verify against PostgreSQL            (CI)
4. Merge → Actions builds image ghcr.io/you/taskapi:<sha>   (release)
5. Actions SSHes to the VPS, runs deploy.sh <sha>           (deploy)
6. deploy.sh checks /actuator/health/readiness              (verify)
7. Unhealthy? deploy.sh switches back to the previous tag   (rollback)
8. Logs and an uptime check watch the live service          (monitor)
```

## Production Relevance

- Production problems are usually *process* problems: an untested change, a secret in Git, a step done by hand. DevOps practices remove those failure points.
- A pipeline is also documentation: a new team member reads the workflow file to learn exactly how the service is built and released.

## Common Mistakes

- Thinking DevOps means "learn Kubernetes". For one service, a VPS with Docker Compose and a CI/CD pipeline is a complete, professional setup.
- Building a different artifact per environment (rebuilding for production) — then production runs something that was never tested.
- Editing a running server by hand and forgetting to put the change in Git.
- Automating deployment before having tests — that only ships bugs faster.

## Interview Angle

- Define DevOps as culture + practices + automation, not as tools.
- Distinguish CI, continuous delivery and continuous deployment precisely.
- Describe your project's pipeline as a sequence: push → build → test → image → registry → deploy → health check → rollback.
- Mention immutability and "same image, different configuration".

## Key Takeaways

- DevOps = the team that builds a service also delivers and runs it, using automation, small changes and fast feedback.
- CI builds and tests every change; continuous delivery makes every change releasable; continuous deployment releases it automatically.
- Build once, deploy the same immutable image everywhere, and change only configuration between environments.
- Out of scope here (what comes next): Kubernetes, Terraform, Ansible, Helm, service meshes and large-scale monitoring stacks.
