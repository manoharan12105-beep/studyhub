# @SpringBootApplication, Startup and Embedded Servers

**Module:** Spring Boot Core · **Interview priority:** Core

## Definition

- **`@SpringBootApplication`** is a convenience annotation that combines **`@SpringBootConfiguration`** (a specialised `@Configuration`), **`@EnableAutoConfiguration`** and **`@ComponentScan`**.
- **`SpringApplication.run(...)`** bootstraps the application: it prepares the environment, creates and refreshes the `ApplicationContext`, starts the **embedded web server**, and runs startup callbacks.
- An **embedded server** is a servlet container (Tomcat by default, or Jetty) started inside your application's JVM instead of your application being deployed into an external server.

## Why It Matters

- "What does `@SpringBootApplication` do internally?" is asked in almost every Boot interview.
- The startup sequence explains where failures happen (property binding, bean creation, port already in use) and where to hook in custom logic.
- Embedded servers changed deployment: one executable JAR per service, ideal for containers.

## @SpringBootApplication

```java
// What @SpringBootApplication is (simplified from the Spring Boot source):
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.context.annotation.ComponentScan;

@SpringBootConfiguration                 // → @Configuration: this class can declare @Bean methods
@EnableAutoConfiguration                 // → import Boot's conditional auto-configuration classes
@ComponentScan(excludeFilters = { /* TypeExcludeFilter, AutoConfigurationExcludeFilter */ })
public @interface SpringBootApplication {
}
```

| Part | What it actually does |
|------|----------------------|
| `@SpringBootConfiguration` | Marks the class as configuration (`@Configuration`), so `@Bean` methods in the main class work. Boot's tests use it to find the application's configuration automatically. |
| `@EnableAutoConfiguration` | Imports `AutoConfigurationImportSelector`, which loads candidates from `AutoConfiguration.imports` and applies conditions. Also registers the main class's package as the **auto-configuration package** (used for entity and repository scanning). |
| `@ComponentScan` | Scans the main class's package and sub-packages for `@Component` classes. The exclude filters stop auto-configuration classes and test-only types from being scanned as ordinary components. |

Useful attributes: `scanBasePackages`, `exclude`, `excludeName`, `proxyBeanMethods`.

## Component Scanning in Spring Boot

Because `@ComponentScan` has no explicit package, **the main class's package is the root** for:

- component scanning (`@Service`, `@RestController`, …),
- JPA entity scanning (`@Entity`) — override with `@EntityScan`,
- Spring Data repository scanning — override with `@EnableJpaRepositories`.

Keep the main class in the root package (`com.example.shop`), never in the default (unnamed) package — scanning the default package scans every JAR on the classpath and usually fails.

## Application Startup

```text
SpringApplication.run(ShopApplication.class, args)
│
├─ 1. Create SpringApplication
│     • deduce web application type from the classpath: SERVLET / REACTIVE / NONE
│     • load ApplicationContextInitializers and ApplicationListeners (META-INF/spring.factories)
│
├─ 2. run()
│     • ApplicationStartingEvent
│     • prepare Environment: command-line args, env vars, system props,
│       application.properties/yml, profiles            → ApplicationEnvironmentPreparedEvent
│     • print banner
│     • create ApplicationContext (servlet → ServletWebServerApplicationContext)
│     • prepare context: run initializers, register main class   → ApplicationPreparedEvent
│     • refresh context:
│          – BeanFactoryPostProcessors: parse @Configuration, component scan, auto-configuration
│          – register BeanPostProcessors
│          – onRefresh(): create embedded web server (Tomcat)
│          – instantiate all non-lazy singletons
│          – start web server (port opens)               → ContextRefreshedEvent
│     • ApplicationStartedEvent
│     • call ApplicationRunner and CommandLineRunner beans
│     • ApplicationReadyEvent  ← application is ready to serve traffic
│
└─ On any failure: FailureAnalyzers print "APPLICATION FAILED TO START" with description and action;
                   ApplicationFailedEvent; context closed.
```

### Running code at startup

```java
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(1)
class CacheWarmupRunner implements ApplicationRunner {

    @Override
    public void run(ApplicationArguments args) {          // after refresh, before ApplicationReadyEvent
        System.out.println("warming caches; --mode=" + args.getOptionValues("mode"));
    }
}

@Component
class ReadinessLogger {

    @EventListener(ApplicationReadyEvent.class)
    void onReady() {
        System.out.println("application ready");
    }
}
```

| Hook | Runs | Use for |
|------|------|---------|
| `@PostConstruct` | During creation of one bean | Initialising that bean's own state |
| `CommandLineRunner` | After context refresh; receives raw `String[] args` | Simple startup tasks |
| `ApplicationRunner` | Same time; receives parsed `ApplicationArguments` | Startup tasks needing options |
| `@EventListener(ApplicationReadyEvent.class)` | After runners; app ready | Start consumers, announce readiness |

An exception thrown from a runner stops the application.

## Embedded Servers

| Server | Starter | Notes |
|--------|---------|-------|
| Tomcat | Included in `spring-boot-starter-webmvc` | Default |
| Jetty | `spring-boot-starter-jetty` (exclude Tomcat) | Supported in Boot 3 and 4 |
| Undertow | `spring-boot-starter-undertow` | Boot 3 only; removed in Boot 4 |
| Reactor Netty | `spring-boot-starter-webflux` | Reactive stack |

How it works: auto-configuration creates a `ServletWebServerFactory` (e.g. `TomcatServletWebServerFactory`); during `onRefresh()` the context asks the factory for a `WebServer`, registers `DispatcherServlet` and filters with it, and starts it when the refresh finishes. Common properties:

```properties
server.port=8080
server.servlet.context-path=/api
server.tomcat.threads.max=200
server.shutdown=graceful
spring.threads.virtual.enabled=true
```

`server.port=0` picks a random free port (useful in tests). With `spring.threads.virtual.enabled=true` on Java 21+, Tomcat handles each request on a **virtual thread**.

## DevTools

`spring-boot-devtools` speeds up development:

- **Automatic restart** when classpath files change. Two class loaders are used: a *base* loader for third-party JARs (loaded once) and a *restart* loader for your classes (thrown away and recreated), so a restart takes about a second.
- **LiveReload** server to refresh the browser.
- **Development defaults** — for example, template caching disabled.
- **Automatically disabled** when the application runs from a packaged JAR (`java -jar`) or is launched by a special class loader; declare it `optional`/`developmentOnly` so it is never shipped.

A known side effect: classes loaded by the two loaders can produce `ClassCastException` (`X cannot be cast to X`) with some libraries that cache classes; exclude those from restart or disable restart.

## Common Mistakes

- Main class in a sub-package → beans in sibling packages are not found.
- Heavy logic in `main` before `SpringApplication.run` — nothing is injected yet.
- Port already in use: `Web server failed to start. Port 8080 was already in use.` — change `server.port` or stop the other process.
- Shipping DevTools to production as a normal dependency.

## Common Interview Traps

- **"@SpringBootApplication = @Configuration + @ComponentScan + @EnableAutoConfiguration."** Accepted shorthand, but precisely it is `@SpringBootConfiguration` (a `@Configuration`) — and the scan has filters that exclude auto-configuration classes.
- **"Spring Boot apps cannot be deployed as WARs."** They can (`SpringBootServletInitializer`, `provided` Tomcat), though JARs are the norm.
- **"Runners run before the web server starts."** In a servlet app the server is already started when runners run.

## Key Takeaways

- `@SpringBootApplication` = configuration + auto-configuration + component scan rooted at the main class's package.
- Startup: prepare environment → create context → refresh (scan, auto-config, beans, web server) → runners → `ApplicationReadyEvent`.
- Tomcat is embedded by default; Jetty is the main alternative; Undertow was dropped in Boot 4.
- DevTools = fast restart via two class loaders; never in production.
