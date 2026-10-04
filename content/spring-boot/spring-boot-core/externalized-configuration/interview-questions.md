# Externalized Configuration: Properties, YAML, @Value and @ConfigurationProperties — Interview Questions

## Beginner

### Q1. What is externalized configuration?

<details>
<summary>Answer</summary>

Keeping configuration outside the compiled code so one build can run in many environments. Spring Boot gathers properties from files, environment variables, system properties and command-line arguments into the `Environment`, with a defined precedence, and binds them to beans through `@Value` and `@ConfigurationProperties`.

</details>

### Q2. What is the difference between `application.properties` and `application.yml`?

<details>
<summary>Answer</summary>

Same purpose, different syntax: properties files are flat `key=value` lines; YAML is hierarchical and more readable for nested structures and lists. If both exist in the same location, `.properties` takes precedence for keys present in both. `@PropertySource` cannot load YAML.

</details>

### Q3. How do you inject a property value into a bean?

<details>
<summary>Answer</summary>

With `@Value("${app.mail.from}")` on a constructor parameter or field (optionally with a default: `${app.mail.from:noreply@x.com}`), or by binding a group of properties to a `@ConfigurationProperties(prefix = "app.mail")` class or record and injecting that object.

</details>

## Intermediate

### Q4. A property is set in `application.properties`, as an environment variable and as a command-line argument. Which value is used?

<details>
<summary>Answer</summary>

The command-line argument. Precedence (higher wins): command-line arguments > Java system properties > OS environment variables > profile-specific config files > generic config files, with files outside the JAR beating files inside it.

</details>

### Q5. How does `SPRING_DATASOURCE_URL` become `spring.datasource.url`?

<details>
<summary>Answer</summary>

Relaxed binding: for environment variables Boot maps the canonical property name by replacing dots with underscores, removing dashes and upper-casing. So `spring.datasource.url` ↔ `SPRING_DATASOURCE_URL` and `app.mail.retry-count` ↔ `APP_MAIL_RETRYCOUNT`. List indexes are written between underscores (`MY_LIST_0_NAME`).

</details>

### Q6. Compare `@Value` and `@ConfigurationProperties`.

<details>
<summary>Answer</summary>

`@Value` injects single values and supports SpEL, but offers limited relaxed binding, no validation and no metadata. `@ConfigurationProperties` binds a prefix to a typed object (records, nested objects, lists, maps, `Duration`, `DataSize`), supports full relaxed binding and `@Validated` validation, and generates IDE metadata. Use `@ConfigurationProperties` for any group of related settings.

</details>

### Q7. How would you keep database passwords out of the repository?

<details>
<summary>Answer</summary>

Reference them as placeholders (`spring.datasource.password=${DB_PASSWORD}`) or rely on relaxed binding of `SPRING_DATASOURCE_PASSWORD`, and supply the value from the deployment environment: environment variables, Kubernetes Secrets, Docker secrets, or a secrets manager (Vault, AWS Secrets Manager) integrated through `spring.config.import`. Never commit real secrets, even in profile-specific files.

</details>

## Advanced

### Q8. How do you make configuration fail fast when a value is invalid?

<details>
<summary>Answer</summary>

Bind it with `@ConfigurationProperties`, annotate the class with `@Validated`, and put Jakarta constraints on the fields (`@NotBlank`, `@Min`, `@Email`). With the validation starter on the classpath, binding validates at startup and the application fails with a clear "Binding validation errors" report instead of failing later at runtime.

</details>

### Q9. Why use constructor binding (records) for `@ConfigurationProperties`?

<details>
<summary>Answer</summary>

The bound object becomes immutable: no setters, so no code can change configuration at runtime, and it is safe to share across threads. Records and single-constructor classes use constructor binding automatically in Boot 3+. Default values can be supplied with `@DefaultValue` on constructor parameters.

</details>

### Q10. Changing a value in `application.properties` on the server has no effect. Why?

<details>
<summary>Answer</summary>

Properties are read and bound when the application starts; beans hold the bound values. The change takes effect only after a restart. Also check that the file being edited is the one actually loaded — a file packaged inside the JAR cannot be edited in place; external files belong next to the JAR or in `./config/`, or are passed with `spring.config.location`/`spring.config.import`.

</details>
