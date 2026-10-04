# Debugging Startup and Configuration

**Module:** Debugging and Internal Behavior · **Interview priority:** Frequently asked

## How to Use This Topic

Each scenario: **Problem → Possible Causes → How to Diagnose → Fix → Prevention → Interview Explanation**. Background: [Startup](../../spring-boot-core/spring-boot-application-and-startup/content.md), [Auto-Configuration](../../spring-boot-core/auto-configuration/content.md), [Externalized Configuration](../../spring-boot-core/externalized-configuration/content.md), [Profiles](../../spring-boot-core/spring-profiles/content.md).

## Why Does an Application Fail During Startup?

### Problem

The process exits with `APPLICATION FAILED TO START` or a long stack trace ending in `BeanCreationException`/`UnsatisfiedDependencyException`.

### Possible Causes

| Symptom in the failure analysis | Typical cause |
|---------------------------------|---------------|
| "Failed to configure a DataSource: 'url' attribute is not specified" | JPA/JDBC starter present but no `spring.datasource.url` (and no embedded DB) |
| "Web server failed to start. Port 8080 was already in use" | Another process (often a previous run) holds the port |
| "required a bean of type … that could not be found" | Scanning/condition problem (see [Debugging Beans](../debugging-beans-and-injection/content.md)) |
| "form a cycle" | Circular dependency |
| "Could not resolve placeholder 'x'" | Missing property / env variable |
| "Schema-validation: missing table" / Flyway checksum mismatch | Schema and entities/migrations out of sync |
| "Not a managed type" | Entity outside the scanned package, or `javax.persistence` import |
| `ClassNotFoundException`/`NoSuchMethodError` | Dependency version conflict |
| "Binding to target … failed" | Invalid value for a `@ConfigurationProperties` field (type or validation) |
| Connection refused / authentication failed | Database/Redis unreachable or wrong credentials |

### How to Diagnose

1. Read the **"Description" and "Action"** of Boot's failure analysis first — it is usually precise.
2. Scroll to the **root cause** ("Caused by:" at the bottom of the stack trace).
3. Run with `--debug` for the condition report; `mvn dependency:tree` for version conflicts.
4. Check the active profiles and the effective property values (startup log; Actuator `/env` in a working environment).

### Fix

Fix the specific cause: set the property, free the port or change `server.port`, align dependency versions, run migrations, correct packages/imports, fix credentials/network.

### Prevention

A `@SpringBootTest` context-loads test per production profile (with Testcontainers for real dependencies); validate configuration with `@Validated @ConfigurationProperties`; fail fast on missing secrets rather than defaulting them.

### Interview Explanation

"Because singletons are created eagerly, configuration problems fail startup instead of the first request. I read Boot's failure analysis, then the deepest 'Caused by', then use `--debug` and `dependency:tree` depending on the category — missing bean, property, datasource, port or version conflict."

## Why Does an Environment Variable Not Load?

### Problem

A value set as an environment variable is ignored; the app uses the default from `application.yml` or fails with a missing placeholder.

### Possible Causes

1. **Wrong relaxed-binding name:** `SPRING_DATASOURCE_URL` is right; `SPRING.DATASOURCE.URL`, `spring_datasource_url` (lower case on Linux) or `APP_MAIL_RETRY-COUNT` are not. Dashes are removed: `app.mail.retry-count` → `APP_MAIL_RETRYCOUNT`.
2. The variable is not visible to the process: set in another shell, not passed into the container (`docker run -e`, Kubernetes `env`), or misspelled in YAML manifests.
3. A **higher-precedence source** overrides it (command-line argument, system property, `SPRING_APPLICATION_JSON`, test properties).
4. Read with `@Value` using a camelCase name that does not match the canonical form.
5. The value is read before it is set (static initialisers, `main` before `SpringApplication.run`).
6. The application was not restarted after changing the variable.

### How to Diagnose

- Print the environment inside the container (`env | grep SPRING_`, `kubectl exec … env`).
- Actuator `/actuator/env/spring.datasource.url` shows the value **and which property source** supplied it.
- Log `environment.getProperty("...")` at startup.

### Fix

Use the canonical upper-snake-case name; pass it into the runtime properly; remove overriding sources; bind with `@ConfigurationProperties` (full relaxed binding); restart.

### Prevention

Document required variables; validate configuration at startup; keep deployment manifests in code review.

### Interview Explanation

"Spring maps environment variables by relaxed binding: dots to underscores, dashes removed, upper case. If a value doesn't apply, it's usually the name, the variable not reaching the process, or a higher-priority source overriding it — Actuator's env endpoint shows which source won."

## Why Does a Profile Not Activate?

### Problem

The log says `No active profile set, falling back to 1 default profile: "default"`, or `application-prod.yml` values are not applied, or `@Profile("prod")` beans are missing.

### Possible Causes

1. Wrong variable/property name: `SPRING_PROFILE_ACTIVE` (missing S), `spring.profile.active`.
2. File name does not match the profile (`application-production.yml` vs profile `prod`), or wrong location/extension.
3. `spring.profiles.active` set **inside** a profile-specific file (not allowed) or overridden by a higher-precedence source.
4. Tests without `@ActiveProfiles`.
5. YAML multi-document syntax errors (`spring.config.activate.on-profile` mis-indented).
6. Expecting `@Profile` on a class that is not scanned.

### How to Diagnose

- The startup log line listing active profiles.
- Actuator `/actuator/env` → `activeProfiles` and property sources (shows `application-prod.yml` if loaded).
- Check spelling of file names and keys.

### Fix

Set `SPRING_PROFILES_ACTIVE=prod` (or `--spring.profiles.active=prod`), rename files to `application-{profile}.yml`, use profile groups instead of activating profiles from profile files, add `@ActiveProfiles` in tests.

### Prevention

Fail fast if no profile is set in deployed environments (e.g. check in a startup runner), and keep profile names short and documented.

### Interview Explanation

"Profiles are decided from `spring.profiles.active` before profile-specific files load. When a profile doesn't apply, it's usually the property name, a file name mismatch, or the property set in a place Boot doesn't allow. The startup log and `/actuator/env` confirm what's active."

## Key Takeaways

- Startup failures are configuration failures caught early; read the failure analysis and root cause.
- Environment variables: canonical upper-snake names, actually present in the process, not overridden.
- Profiles: `SPRING_PROFILES_ACTIVE`, matching file names, no activation from profile files; verify in the startup log.
