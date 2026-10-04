# Starters and Maven Dependency Management — Interview Questions

## Beginner

### Q1. What is a Spring Boot starter?

<details>
<summary>Answer</summary>

A dependency descriptor that bundles a tested set of libraries for one capability, so you add one dependency instead of many. For example, `spring-boot-starter-data-jpa` brings Spring Data JPA, Hibernate, HikariCP and Spring's JDBC/ORM support. Starters contain no code; auto-configuration reacts to the classes they put on the classpath.

</details>

### Q2. Why do Spring Boot dependencies often have no version in `pom.xml`?

<details>
<summary>Answer</summary>

Versions are managed by Spring Boot's BOM (`spring-boot-dependencies`), inherited through `spring-boot-starter-parent` or imported in `dependencyManagement`. Boot tests these versions together, which avoids incompatible combinations.

</details>

### Q3. What does `spring-boot-maven-plugin` do?

<details>
<summary>Answer</summary>

It repackages the build output into an executable "fat" JAR (application classes in `BOOT-INF/classes`, dependencies in `BOOT-INF/lib`, plus Boot's loader as `Main-Class`), and provides goals such as `spring-boot:run` and `spring-boot:build-image` (OCI image with buildpacks).

</details>

## Intermediate

### Q4. What is the difference between `dependencies` and `dependencyManagement`?

<details>
<summary>Answer</summary>

`<dependencies>` adds libraries to the project. `<dependencyManagement>` only declares versions (and optionally scopes) to use if the library is added — by this project, its modules or transitively. Importing a BOM into `dependencyManagement` is how Boot's versions are applied without inheriting its parent.

</details>

### Q5. What does `spring-boot-starter-parent` provide beyond versions?

<details>
<summary>Answer</summary>

Default plugin configuration: Java release from `java.version`, compilation with `-parameters`, UTF-8 encoding, resource filtering for `application*.properties`/`yml`, sensible configuration for `spring-boot-maven-plugin`, surefire and others, and version properties (`<jackson-bom.version>` etc.) you can override.

</details>

### Q6. How do you use Jetty instead of Tomcat?

<details>
<summary>Answer</summary>

Exclude `spring-boot-starter-tomcat` from the web starter and add `spring-boot-starter-jetty`. Auto-configuration detects Jetty classes instead of Tomcat and creates a Jetty server factory.

</details>

### Q7. How do you override the version of one managed library?

<details>
<summary>Answer</summary>

With the parent, set its version property: `<properties><postgresql.version>…</postgresql.version></properties>`. With a BOM import, declare the library with the desired version in `dependencyManagement` **before** the BOM import, or set the version directly on the dependency. Do it only for a reason (security fix) and test, because the managed set was tested together.

</details>

## Advanced

### Q8. How does `java -jar app.jar` run code from nested JARs, which the JDK cannot load directly?

<details>
<summary>Answer</summary>

The manifest's `Main-Class` is Boot's `JarLauncher`, not your class. It creates a class loader that understands nested JAR entries in `BOOT-INF/lib` and `BOOT-INF/classes`, then reads `Start-Class` from the manifest and invokes your `main` method through that class loader.

</details>

### Q9. Two libraries need different versions of Jackson. How do you diagnose and resolve it?

<details>
<summary>Answer</summary>

Run `mvn dependency:tree -Dincludes=com.fasterxml.jackson.core` (or the Jackson 3 group) to see which versions are requested and which one Maven's nearest-wins rule selected. With Boot's BOM, the managed version wins. Resolve by aligning to the managed version (upgrade the library), excluding the conflicting transitive dependency, or, if unavoidable, pinning a version and testing. Runtime symptoms are usually `NoSuchMethodError` or `ClassNotFoundException`.

</details>
