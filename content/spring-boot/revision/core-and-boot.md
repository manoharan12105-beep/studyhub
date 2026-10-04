# Spring Core and Spring Boot

Revision points for the Spring container, dependency injection and Spring Boot core. Comparisons are in Comparison Tables; traps per module in Common Interview Traps.

## Spring Framework

- Spring is a Java application framework whose core is an **IoC container** that creates and wires objects (beans).
- On top of the core: AOP, transactions, MVC/REST, data access, security, testing, integration.
- Spring Framework 7 targets JDK 17+ (these notes use JDK 21), Jakarta EE 11 (`jakarta.persistence`, `jakarta.validation`, `jakarta.servlet` — not the old Java EE `javax.*` packages).
- Spring Boot is not a replacement — it is opinionated configuration and packaging *on top of* Spring.
- Benefits: loose coupling, testability (inject fakes), declarative cross-cutting concerns (`@Transactional`), huge ecosystem.

## The Spring Container

- `BeanFactory` = basic DI container; `ApplicationContext` = `BeanFactory` + events, i18n, resource loading, environment, eager singleton creation, automatic post-processor registration.
- Container reads **bean definitions** (class, scope, dependencies, init/destroy) from annotations, `@Bean` methods or XML, then instantiates and wires.
- `refresh()` phases: load definitions → run `BeanFactoryPostProcessor`s → register `BeanPostProcessor`s → instantiate non-lazy singletons → publish `ContextRefreshedEvent`.
- Spring Boot creates `AnnotationConfigServletWebServerApplicationContext` for servlet apps.
- `close()` destroys singletons in reverse dependency order.

## Spring Beans

- A bean is an object whose lifecycle the container manages; a plain `new` object is not a bean.
- Ways to declare: stereotype + scanning, `@Bean` method, `@Import`, registrar / XML.
- Default bean name: class name with lower-case first letter (`orderService`) or the `@Bean` method name.
- Bean overriding is **disabled** by default in Boot; two `@Bean` methods with one name → `BeanDefinitionOverrideException`.
- Exception: a `@Bean` method may replace a scanned component of the same name.
- Singleton beans must be stateless or thread-safe — one instance serves all threads.

## Bean Lifecycle

- Order: instantiate → populate (inject) → `*Aware` callbacks → BPP `postProcessBeforeInitialization` → `@PostConstruct` → `afterPropertiesSet()` → custom `initMethod` → BPP `postProcessAfterInitialization` (proxies created here) → ready.
- Shutdown: `@PreDestroy` → `destroy()` → custom `destroyMethod`.
- Prototype beans get no destroy callbacks.
- `@PostConstruct` runs after injection — the right place for validation and warm-up; a constructor cannot see field-injected deps.
- `SmartInitializingSingleton` / `ApplicationReadyEvent` for work after all beans exist.

## Component Scanning and Stereotypes

- `@Component` is the base; `@Service`, `@Repository`, `@Controller`, `@RestController`, `@Configuration` are specialisations.
- `@Repository` adds persistence exception translation to `DataAccessException`.
- `@SpringBootApplication` scans its own package and sub-packages — put it in the root package.
- Classes outside the scanned packages are silently missing → `NoSuchBeanDefinitionException`.
- Filters: `@ComponentScan(includeFilters/excludeFilters)`; entities/repositories outside need `@EntityScan`/`@EnableJpaRepositories`.

## @Configuration and @Bean

- `@Bean` registers the return value of a method — used for third-party classes you cannot annotate.
- Full mode (`@Configuration`, `proxyBeanMethods=true`): CGLIB subclass intercepts inter-bean calls → one shared instance.
- Lite mode (`proxyBeanMethods=false` or `@Bean` in a `@Component`): direct calls create **new** objects; prefer method parameters to express dependencies.
- `static @Bean` for `BeanFactoryPostProcessor`s so they do not force early creation of the config class.
- `destroyMethod` is inferred (`close`/`shutdown`) for `@Bean`s; set `destroyMethod = ""` to disable.
- `@Import`, `@Conditional*`, `@Profile` compose configuration.

## Bean Scopes

- singleton (default, one per container), prototype (new per lookup), request, session, application, websocket.
- Prototype into singleton = injected **once**; use `ObjectProvider<T>`, `@Lookup` or a scoped proxy for fresh instances.
- Request/session beans in singletons need `proxyMode = ScopedProxyMode.TARGET_CLASS` (default for `@RequestScope`/`@SessionScope`).
- Container does not manage prototype destruction.
- Singleton ≠ GoF singleton: one per container per bean definition, not per JVM.

## IoC and Dependency Injection

- **IoC:** the framework controls object creation and wiring; your code declares needs.
- **DI:** the container supplies dependencies through constructors, setters or fields.
- Results: loose coupling (depend on interfaces), testable code (pass fakes), central configuration.
- DI is one form of IoC; others are templates and callbacks, event listeners.
- `ServiceLocator`/`getBean` in business code reintroduces coupling — avoid.

## Injection Types

- **Constructor** (recommended): required deps, `final` fields, immutable, testable without Spring, cycles detected at startup.
- Single constructor → `@Autowired` optional.
- **Setter:** optional or reconfigurable deps.
- **Field:** concise but hidden deps, no `final`, needs reflection to test — avoid in production code.
- Optional deps: `ObjectProvider<T>`, `Optional<T>`, `@Autowired(required=false)`.
- Collections: `List<Plugin>` injects all beans of the type (order via `@Order`), `Map<String, Plugin>` keyed by name.

## Autowiring and Bean Resolution

- Resolution by **type** first; with several candidates: `@Qualifier` → `@Primary` → `@Priority` → parameter/field name.
- `@Primary` beats a matching parameter name; only `@Qualifier` overrides `@Primary`.
- No candidate → `NoSuchBeanDefinitionException`; several with no tie-break → `NoUniqueBeanDefinitionException`.
- Generic types are part of matching (`Repository<User>` vs `Repository<Order>`).
- Custom qualifier annotations make intent explicit.

## Circular Dependencies

- A → B → A. Constructor cycles can never be resolved → `BeanCurrentlyInCreationException`.
- Spring Framework can resolve setter/field cycles through early singleton references.
- Spring Boot sets `spring.main.allow-circular-references=false` (since 2.6), so even those fail.
- Fix the design: extract the shared logic into a third bean, use events, or invert one dependency.
- `@Lazy` on one injection point is a workaround (injects a proxy), not a fix.

## Spring Boot

- Boot = auto-configuration + starters + embedded server + externalized configuration + Actuator + executable JAR.
- Goal: production-ready app with minimal configuration; convention over configuration with easy overrides.
- Versions used here: Boot 4.1, Framework 7, Security 7, Hibernate 7, Jackson 3, JDK 21.
- Embedded Tomcat (default) or Jetty; Undertow is not supported in Boot 4.
- Boot is still Spring: every Boot feature is ordinary beans and conditions.

## Starters and Maven

- A starter is a dependency descriptor that pulls a coherent set of libraries (`spring-boot-starter-webmvc`, `-data-jpa`, `-security`, `-validation`, `-actuator`).
- The parent / BOM manages versions — omit `<version>` for managed dependencies.
- Boot 4 renamed starters: `spring-boot-starter-web` → `-webmvc`, `-aop` → `-aspectj`, `-oauth2-*` → `-security-oauth2-*`.
- `spring-boot-maven-plugin` repackages an executable fat JAR (`BOOT-INF/classes`, `BOOT-INF/lib`).
- Test starters per technology (`spring-boot-starter-webmvc-test`, `-data-jpa-test`).

## Auto-Configuration

- `@EnableAutoConfiguration` loads classes listed in `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`.
- Each is guarded by conditions: `@ConditionalOnClass`, `@ConditionalOnMissingBean`, `@ConditionalOnProperty`, `@ConditionalOnWebApplication`…
- `@ConditionalOnMissingBean` = **your bean wins**; Boot backs off.
- Auto-configs run after user configuration.
- Debug with `--debug` / `debug=true` (condition evaluation report) or Actuator `/actuator/conditions`.
- Exclude with `@SpringBootApplication(exclude = …)` or `spring.autoconfigure.exclude`.

## @SpringBootApplication and Startup

- `@SpringBootApplication` = `@SpringBootConfiguration` + `@EnableAutoConfiguration` + `@ComponentScan`.
- `SpringApplication.run`: deduce app type → create `Environment` (load properties/profiles) → print banner → create context → refresh (beans, embedded server) → run `ApplicationRunner`/`CommandLineRunner` → `ApplicationReadyEvent`.
- Failures before refresh = configuration; during refresh = beans; `FailureAnalyzer` prints readable causes.
- `spring.main.lazy-initialization=true` speeds startup but hides errors until first use.
- Graceful shutdown is the default (`server.shutdown=graceful`, 30 s timeout).

## Externalized Configuration

- Sources in precedence (high → low, simplified): command-line args → `SPRING_APPLICATION_JSON` → OS env vars → profile-specific files → `application.properties/yml` (outside jar beats inside).
- Relaxed binding: `app.mail.max-size` ← `APP_MAIL_MAXSIZE` env var; list index `APP_MAIL_RECIPIENTS_0`.
- `@ConfigurationProperties(prefix)` on a record = typed, validated (`@Validated`), immutable config — preferred over many `@Value`s.
- `@Value("${key:default}")` for single values; SpEL with `#{}`.
- `spring.config.import` for extra files, config trees (`configtree:`) for mounted secrets.
- Never commit secrets — inject from env/secret manager.

## Profiles

- `@Profile("dev")` on beans/config; `application-dev.yml` overrides the base file.
- Activate with `spring.profiles.active` (env `SPRING_PROFILES_ACTIVE`); `default` profile when none active.
- Profile groups: `spring.profiles.group.prod=db,metrics`.
- Expressions: `@Profile("!prod")`, `"dev & local"`.
- Profile-specific files cannot set `spring.profiles.active`; keep profiles few and environment-based.
