# Lab 16 — Interview Questions

## Beginner

### Q1. Why tag images with the commit SHA?

**Style:** Why

<details>
<summary>Answer</summary>

It is unique per build and traceable: from a running container you know the exact source code, the CI run and the tests behind it, and rollback means deploying the previous SHA.

</details>

## Intermediate

### Q2. Why does the publish job not run for pull requests?

**Style:** Why

<details>
<summary>Answer</summary>

Pull requests contain unreviewed code (possibly from forks). Publishing their images would put untrusted builds into the registry that deployments use. The `if:` condition limits publishing to pushes to `main`, after review and green tests.

</details>

### Q3. Which credential does the server use for pulling, and why not your normal token?

**Style:** Trade-off

<details>
<summary>Answer</summary>

A dedicated token limited to `read:packages`. If the server is compromised, the attacker can only read images — not push malicious ones or delete releases. A personal token with broad scopes would expose your whole account.

</details>
