# Lab 10 — Interview Questions

## Beginner

### Q1. How do you make sure `.env` is never committed?

**Style:** How

<details>
<summary>Answer</summary>

Add `.env` to `.gitignore` before creating it, commit only `.env.example`, verify with `git check-ignore -v .env` and `git status`, and enable secret scanning/push protection on the repository as a safety net.

</details>

## Intermediate

### Q2. Why is "fail fast on missing configuration" a production feature?

**Style:** Why

<details>
<summary>Answer</summary>

A clear start-up failure is caught by the deployment's health check and rolled back immediately. Silently falling back to defaults could connect production to a wrong database or run with insecure settings, and the damage would be discovered much later.

</details>

### Q3. `.env` was committed yesterday. Is `git rm --cached .env` enough?

**Style:** Trap

<details>
<summary>Answer</summary>

No. It stops tracking the file from now on, but the secrets remain in the history and every clone. Rotate every secret in it first; rewriting history is optional and secondary.

</details>
