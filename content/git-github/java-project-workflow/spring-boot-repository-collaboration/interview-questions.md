# Spring Boot Repository Collaboration — Interview Questions

## Beginner

### Q1. Should `application.properties` be committed?

**Style:** Trap

<details>
<summary>Answer</summary>

Yes — but only with defaults and placeholders such as `spring.datasource.password=${DB_PASSWORD}`, never real secrets. Local overrides go in ignored files (`application-local.properties`, `.env`), and real values come from the environment or a secret store.

</details>

## Intermediate

### Q2. How do developers keep their own local database settings without conflicting in Git?

**Style:** How

<details>
<summary>Answer</summary>

Each developer keeps overrides in an ignored profile file (`application-local.properties`, activated with `SPRING_PROFILES_ACTIVE=local`) or in environment variables. The committed configuration contains shared defaults; an example file documents required variables. Nobody commits personal URLs or passwords.

</details>

### Q3. What do you check before making a Spring Boot repository public?

**Style:** Scenario

<details>
<summary>Answer</summary>

`git ls-files` for anything that shouldn't be tracked; a history scan (`git log --all -G` / `-S`) for passwords, tokens and keys; that real secrets were rotated if they ever appeared; that a fresh clone builds with `./mvnw -B verify`; and that the README explains required environment variables.

</details>

## Advanced

### Q4. Why is `${DB_PASSWORD}` without a default better than `${DB_PASSWORD:secret}`?

**Style:** Why

<details>
<summary>Answer</summary>

Without a default the application fails fast at startup when the password isn't provided, making misconfiguration obvious. A default would put a credential in Git (a leak) and silently connect with it in environments where the variable was forgotten.

</details>
