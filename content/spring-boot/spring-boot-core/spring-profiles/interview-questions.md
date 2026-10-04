# Profiles — Interview Questions

## Beginner

### Q1. What are Spring profiles?

<details>
<summary>Answer</summary>

Named groups of configuration and beans that apply only when the profile is active — for example `dev`, `test`, `prod`. Boot loads `application-{profile}.properties/yml` for active profiles, and `@Profile` registers beans conditionally.

</details>

### Q2. How do you activate a profile?

<details>
<summary>Answer</summary>

Set `spring.profiles.active`: in a config file, as a command-line argument (`--spring.profiles.active=prod`), an environment variable (`SPRING_PROFILES_ACTIVE=prod`), a system property, with `@ActiveProfiles` in tests, or programmatically with `SpringApplication.setAdditionalProfiles`.

</details>

### Q3. What does `@Profile` do?

<details>
<summary>Answer</summary>

It makes a component, configuration class or `@Bean` method conditional on active profiles. `@Profile("prod")` registers the bean only when `prod` is active; `@Profile("!prod")` registers it in every other case. Expressions with `&` and `|` are allowed.

</details>

## Intermediate

### Q4. How do profile-specific properties interact with `application.properties`?

<details>
<summary>Answer</summary>

Both are loaded. Profile-specific files have higher precedence, so they override only the keys they define; everything else comes from the shared file. With several active profiles, later profiles override earlier ones.

</details>

### Q5. What happens if no profile is activated?

<details>
<summary>Answer</summary>

The `default` profile is active. Beans with `@Profile("default")` are registered and `application-default.properties` is loaded if it exists. The default can be changed with `spring.profiles.default`.

</details>

### Q6. What are profile groups?

<details>
<summary>Answer</summary>

A way to activate several profiles with one name: `spring.profiles.group.prod=proddb,prodmq`. Activating `prod` also activates `proddb` and `prodmq`, letting you split configuration by concern without repeating long lists in every deployment.

</details>

## Advanced

### Q7. Why can't you set `spring.profiles.active` inside `application-prod.yml`?

<details>
<summary>Answer</summary>

Profile-specific documents are loaded only after the active profiles have been determined; letting them change the active profiles would create a circular, order-dependent process. Boot therefore rejects `spring.profiles.active` (and `spring.profiles.include`) in profile-specific files and `on-profile` documents. Use profile groups for such composition.

</details>

### Q8. Should profiles be used to toggle features?

<details>
<summary>Answer</summary>

Generally no. Profiles describe environments; features should be toggled with properties (`@ConditionalOnProperty`, `@ConfigurationProperties` flags) or a feature-flag system. Mixing the two leads to combinatorial profiles (`prod-with-new-checkout`) and business code checking environment names.

</details>
