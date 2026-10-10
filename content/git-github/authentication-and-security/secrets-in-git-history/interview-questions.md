# Secrets in Git History — Interview Questions

## Beginner

### Q1. You committed a password and then deleted the file in the next commit. Is it gone?

**Style:** Trap

<details>
<summary>Answer</summary>

No. The earlier commit still contains the file; `git show <commit>:<path>` or `git log -p` reveals it, and every clone has it. Deleting only changes the latest snapshot.

</details>

## Intermediate

### Q2. You pushed an API key to a public GitHub repository. What do you do, in order?

**Style:** Scenario

<details>
<summary>Answer</summary>

1. Revoke/rotate the key immediately and update systems that use it. 2. Check logs for misuse. 3. Remove it from the code (environment variable or secret store), untrack and ignore the file, add a template. 4. Optionally purge history with `git filter-repo` or BFG, force-push in coordination, have everyone re-clone, and ask GitHub to clear cached views. 5. Enable push protection and secret scanning.

</details>

### Q3. How do you keep secrets out of a Spring Boot repository?

**Style:** How

<details>
<summary>Answer</summary>

Reference them with placeholders (`spring.datasource.password=${DB_PASSWORD}`) and supply values via environment variables or a secret manager; keep local overrides like `application-local.properties` and `.env` in `.gitignore`; commit example files with fake values; enable secret scanning/push protection; review staged diffs.

</details>

## Advanced

### Q4. Why isn't rewriting history enough after a leak?

**Style:** Why

<details>
<summary>Answer</summary>

The secret may already have been copied — by clones, forks, CI logs, caches, search engines or automated scanners that harvest credentials within minutes. Rewriting changes your repository, not those copies. Only revoking the credential makes the leaked value worthless.

</details>

### Q5. What does a history rewrite with `git filter-repo` do to the team?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Every commit after the first affected one gets a new id, so all branches, tags, open pull requests and existing clones refer to old commits. Everyone must push work beforehand and re-clone afterwards; an old clone pushed back reintroduces the secret. It's justified for public exposure or policy, coordinated like an outage.

</details>
