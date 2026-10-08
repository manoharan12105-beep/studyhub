# DevOps and Docker Interview Questions

**Module:** Interview Preparation · **Interview priority:** Core

## What Is It?

A cross-topic bank of the DevOps questions a Java backend developer is asked most: Docker and images, Dockerfiles, networking and volumes, Compose, CI/CD and registries, Nginx, HTTPS and DNS, configuration and secrets, health checks, security and scaling basics. Scenario and production-failure questions are in [DevOps Scenario and Troubleshooting Questions](../devops-scenario-interview-questions/content.md).

## Why It Matters

Backend interviews increasingly end with "how would you deploy this?". Short, precise answers with one concrete detail from your own project ("we tag images with the commit SHA and roll back by tag") stand out.

## Core Concept

How to answer a DevOps question:

```text
1. Define it in one sentence.             "A volume is storage managed outside the container's lifecycle."
2. Say why it exists.                      "Container writable layers are deleted with the container."
3. Give the concrete detail or command.    "-v pgdata:/var/lib/postgresql; down keeps it, down -v deletes it."
4. Add the trap or trade-off.              "Init variables apply only to an empty volume."
5. Connect it to your project.             "Our PostgreSQL has no published port and a daily off-site dump."
```

Questions are grouped Beginner → Advanced and labelled with a style: What, Why, How, Comparison, Trap, Trade-off, Architecture, What happens if.

## Key Takeaways

- Precision beats buzzwords: image vs container, `EXPOSE` vs `-p`, `down` vs `down -v`, delivery vs deployment.
- Always add the production angle: security, rollback, health, secrets.
- Use the flashcards view of this topic for spaced revision.
