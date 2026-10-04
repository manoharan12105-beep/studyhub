# Core and Boot Essentials

One line per topic: what to say in the first 30 seconds.

## Container and Beans

- **Spring** — IoC container + modules (AOP, MVC, data, transactions, security); Boot sits on top.
- **Container** — `ApplicationContext` (= `BeanFactory` + events, i18n, environment, eager singletons) reads bean definitions, creates and wires beans.
- **Bean** — container-managed object; declared by stereotype + scanning or `@Bean`; default singleton.
- **Lifecycle** — instantiate → inject → Aware → BPP before → `@PostConstruct` → `afterPropertiesSet` → init → BPP after (proxy) → use → `@PreDestroy` → destroy.
- **Scanning** — `@SpringBootApplication` package + sub-packages; `@Repository` adds exception translation.
- **`@Configuration` / `@Bean`** — full mode proxies inter-bean calls (one instance); lite mode doesn't.
- **Scopes** — singleton, prototype, request, session, application; prototype in singleton = injected once → `ObjectProvider`.

## Dependency Injection

- **IoC vs DI** — IoC = framework controls creation; DI = dependencies supplied from outside.
- **Injection types** — constructor (default; `final`, required, testable), setter (optional), field (avoid).
- **Resolution** — by type → `@Qualifier` → `@Primary` → name; none = `NoSuchBean…`, many = `NoUniqueBean…`.
- **Cycles** — constructor cycles never resolve; Boot forbids all cycles; redesign (third bean, events).

## Spring Boot

- **Boot** — auto-configuration + starters + embedded server + external config + Actuator + fat JAR.
- **Starters** — curated dependency sets; versions from the BOM; Boot 4: `-webmvc`, `-aspectj`, `-security-oauth2-*`.
- **Auto-configuration** — `.imports` candidates + `@Conditional*`; `@ConditionalOnMissingBean` → your bean wins; `--debug` for the report.
- **Startup** — `run()` → environment → context → refresh (beans, server) → runners → `ApplicationReadyEvent`; graceful shutdown default.
- **Configuration** — command line > env vars > profile files > `application.yml`; `@ConfigurationProperties` records for typed config.
- **Profiles** — `@Profile`, `application-<p>.yml`, `SPRING_PROFILES_ACTIVE`; `default` when none; groups.
