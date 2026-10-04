# Starters and Maven Dependency Management

**Module:** Spring Boot Core · **Interview priority:** Core

## Definition

- A **starter** is a dependency descriptor — a small artifact with no code of its own — that pulls in a tested set of libraries for one capability. `spring-boot-starter-data-jpa` brings Spring Data JPA, Hibernate, HikariCP and the JDBC support module.
- **Dependency management** is Spring Boot's curated list of compatible versions (a Maven **BOM**, bill of materials). Because Boot manages versions, you declare most dependencies **without** a `<version>`.

## Why It Matters

- Version conflicts (two Jackson versions, a Hibernate that does not match Spring Data) were a major source of runtime errors before Boot.
- Interviewers ask "What is a starter?" and "How does Boot manage versions?" and expect `spring-boot-starter-parent`, BOM and `dependencyManagement` in the answer.
- Knowing what a starter brings explains which auto-configurations become active.

## Spring Boot Starters

| Starter (Boot 4 name) | Brings | Activates |
|-----------------------|--------|-----------|
| `spring-boot-starter-webmvc` (Boot 3: `-web`) | Spring MVC, Jackson, embedded Tomcat (no Bean Validation — add the validation starter) | `DispatcherServlet`, JSON converters, Tomcat |
| `spring-boot-starter-data-jpa` | Spring Data JPA, Hibernate, HikariCP, JDBC | `DataSource`, `EntityManagerFactory`, `JpaTransactionManager`, repositories |
| `spring-boot-starter-security` | Spring Security | `SecurityFilterChain` defaults, generated user |
| `spring-boot-starter-validation` | Hibernate Validator (Jakarta Bean Validation) | `Validator`, method validation |
| `spring-boot-starter-actuator` | Actuator, Micrometer | `/actuator/health`, metrics |
| `spring-boot-starter-test` | JUnit 5, AssertJ, Mockito, Spring Test | Test support |
| `spring-boot-starter` | Core: Spring context, logging (Logback), YAML | Logging, config |

Naming rule: official starters are `spring-boot-starter-*`; third-party ones are `<name>-spring-boot-starter` (for example `mybatis-spring-boot-starter`).

## Maven Dependency Management

### Option 1: inherit `spring-boot-starter-parent`

```xml
<project>
  <modelVersion>4.0.0</modelVersion>

  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>4.0.6</version>
    <relativePath/>
  </parent>

  <groupId>com.example</groupId>
  <artifactId>shop</artifactId>
  <version>1.0.0</version>

  <properties>
    <java.version>21</java.version>
  </properties>

  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-webmvc</artifactId>   <!-- no <version>: managed by the parent -->
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
      <groupId>org.postgresql</groupId>
      <artifactId>postgresql</artifactId>
      <scope>runtime</scope>                               <!-- needed only when running -->
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-test</artifactId>
      <scope>test</scope>
    </dependency>
  </dependencies>

  <build>
    <plugins>
      <plugin>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-maven-plugin</artifactId>  <!-- builds the executable JAR -->
      </plugin>
    </plugins>
  </build>
</project>
```

The parent provides:

- **Dependency versions** — it inherits from `spring-boot-dependencies`, the BOM listing hundreds of library versions.
- **Plugin configuration** — compiler release from `java.version`, the `-parameters` flag (needed for name-based binding), resource filtering for `application*.properties/yml`, `spring-boot-maven-plugin` defaults.
- **Overridable version properties** — e.g. `<postgresql.version>42.7.5</postgresql.version>` to change one library's version.

### Option 2: import the BOM (when you already have a corporate parent)

```xml
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-dependencies</artifactId>
      <version>4.0.6</version>
      <type>pom</type>
      <scope>import</scope>
    </dependency>
  </dependencies>
</dependencyManagement>
```

This gives version management but **not** the parent's plugin configuration; configure the compiler (`-parameters`) and the Boot plugin yourself.

### `dependencies` vs `dependencyManagement`

| | `<dependencies>` | `<dependencyManagement>` |
|--|------------------|--------------------------|
| Adds the library to the build | Yes | No |
| Purpose | Declare what you use | Declare **versions** (and scopes) for whoever uses it |
| Typical content | Starters, drivers | BOM imports, version pins |

### Maven scopes you will meet

| Scope | Compile | Test | Runtime / packaged | Example |
|-------|---------|------|--------------------|---------|
| `compile` (default) | Yes | Yes | Yes | starters |
| `runtime` | No | Yes | Yes | JDBC driver |
| `test` | No | Yes (test only) | No | `spring-boot-starter-test` |
| `provided` | Yes | Yes | No (container supplies it) | servlet API in WAR deployments |
| `optional` flag | — | — | Not passed to consumers | `spring-boot-devtools`, Lombok |

### Executable JAR

`mvn package` with `spring-boot-maven-plugin` produces a "fat" JAR:

```text
shop-1.0.0.jar
├── META-INF/MANIFEST.MF        Main-Class: org.springframework.boot.loader.launch.JarLauncher
│                                Start-Class: com.example.shop.ShopApplication
├── BOOT-INF/classes/           your compiled classes and application.properties
├── BOOT-INF/lib/               all dependency JARs (nested)
└── org/springframework/boot/loader/   the launcher that can read nested JARs
```

`java -jar shop-1.0.0.jar` runs `JarLauncher`, which builds a class loader over the nested JARs and calls your `main`.

## Internal Behavior

- A starter's `pom.xml` contains only dependencies; Boot's auto-configuration decides what to configure based on which classes those dependencies put on the classpath.
- `mvn dependency:tree` shows exactly what each starter pulled in and which version won; use it to debug conflicts.
- Excluding a transitive dependency (e.g. swapping Tomcat for Jetty) is done with `<exclusions>` on the starter plus adding the alternative starter.

## Common Mistakes

- Adding `<version>` to Boot-managed dependencies and drifting out of the tested set.
- Mixing Boot 3 and Boot 4 artifacts (for example a third-party starter built for Boot 3 in a Boot 4 project).
- Putting the JDBC driver in `compile` scope (harmless) or `test` scope (fails at runtime).
- Using the BOM import without configuring `-parameters`, then wondering why `@PathVariable` without a name fails.

## Common Interview Traps

- **"A starter contains auto-configuration code."** The starter is just dependencies; auto-configuration lives in Boot's autoconfigure modules (or the library's own module).
- **"`dependencyManagement` adds dependencies."** It only sets versions; you still declare them in `<dependencies>`.
- **"The parent POM is required for Spring Boot."** Importing `spring-boot-dependencies` as a BOM works too.

## Key Takeaways

- Starters = curated dependency bundles; the BOM = curated versions.
- Use `spring-boot-starter-parent` (versions + plugin config) or import `spring-boot-dependencies` (versions only).
- `spring-boot-maven-plugin` builds an executable fat JAR run by `JarLauncher`.
