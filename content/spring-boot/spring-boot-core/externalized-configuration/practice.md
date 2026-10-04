# Externalized Configuration: Properties, YAML, @Value and @ConfigurationProperties — Practice

### P1. Which port?

**Difficulty:** Easy · **Type:** MCQ

`application.properties` has `server.port=8080`, the container sets `SERVER_PORT=9000`, and the command is `java -jar app.jar --server.port=9100`. Which port is used?

- A) 8080
- B) 9000
- C) 9100
- D) Startup fails: conflicting values

<details>
<summary>Answer</summary>

**Answer:** C) 9100

**Explanation:** Command-line arguments have higher precedence than environment variables, which beat config files.

</details>

### P2. Environment variable name

**Difficulty:** Easy · **Type:** Conceptual

Write the environment variable names for `spring.jpa.show-sql` and `app.jwt.access-token-ttl`.

<details>
<summary>Answer</summary>

`SPRING_JPA_SHOWSQL` and `APP_JWT_ACCESSTOKENTTL` — dots become underscores, dashes are removed, everything upper case.

</details>

### P3. Bind JWT settings

**Difficulty:** Medium · **Type:** Coding

Bind `app.jwt.secret` (required, not blank), `app.jwt.access-token-ttl` (duration, default 15 minutes) and `app.jwt.issuer` to an immutable, validated object.

<details>
<summary>Answer</summary>

```java
import java.time.Duration;
import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

@ConfigurationProperties(prefix = "app.jwt")
@Validated
record JwtProperties(@NotBlank String secret,
                     @DefaultValue("15m") Duration accessTokenTtl,
                     String issuer) {
}
```

Register it with `@ConfigurationPropertiesScan` on the main class (or `@EnableConfigurationProperties(JwtProperties.class)`), and supply the secret as `APP_JWT_SECRET` from the environment.

</details>

### P4. YAML surprise

**Difficulty:** Medium · **Type:** Debugging

A developer changes `server.port` in `application.yml` to 9090, but the app still starts on 8081. There is also an `application.properties` in the same folder. Explain.

<details>
<summary>Answer</summary>

When both files are in the same location and define the same key, the `.properties` file wins. `application.properties` probably sets `server.port=8081`. Keep one format per project.

</details>

### P5. Missing placeholder

**Difficulty:** Medium · **Type:** Debugging

Startup fails with `Could not resolve placeholder 'payment.api-key' in value "${payment.api-key}"` only in production. What do you check?

<details>
<summary>Answer</summary>

That the production environment actually provides the value: the variable `PAYMENT_APIKEY` (relaxed name), a mounted secrets file referenced by `spring.config.import`, or a profile-specific file for the active profile. Also check the active profile and spelling. Do not add a fake default for a required secret — failing fast is correct.

</details>
