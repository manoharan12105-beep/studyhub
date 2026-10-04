# Starters and Maven Dependency Management — Practice

### P1. Scope of the driver

**Difficulty:** Easy · **Type:** MCQ

Which Maven scope fits the PostgreSQL JDBC driver in a Spring Boot application that uses only JPA and `DataSource` APIs in code?

- A) `test`
- B) `provided`
- C) `runtime`
- D) `system`

<details>
<summary>Answer</summary>

**Answer:** C) `runtime`

**Explanation:** Code compiles against JDBC/JPA interfaces; the driver is needed only when the application runs (and in tests).

</details>

### P2. NoSuchMethodError

**Difficulty:** Medium · **Type:** Debugging

After adding a library, startup fails with `java.lang.NoSuchMethodError` inside Hibernate code. What is the likely cause and your first diagnostic command?

<details>
<summary>Answer</summary>

A transitive dependency brought in a different version of a library Hibernate uses (or of Hibernate itself), and Maven chose an incompatible version. Run `mvn dependency:tree` (optionally `-Dincludes=org.hibernate.orm`) to find which artifact pulls the conflicting version, then exclude it or align to the Boot-managed version.

</details>

### P3. Company parent POM

**Difficulty:** Medium · **Type:** Scenario

Your company requires every project to inherit `com.company:corp-parent`. How do you still get Spring Boot's dependency management, and what else must you configure?

<details>
<summary>Answer</summary>

Import `org.springframework.boot:spring-boot-dependencies` with `<type>pom</type><scope>import</scope>` in `dependencyManagement`. Because the Boot parent's plugin configuration is not inherited, configure `spring-boot-maven-plugin` (with the `repackage` goal) and the compiler's `-parameters` flag yourself.

</details>

### P4. What is in the JAR?

**Difficulty:** Easy · **Type:** Conceptual

Where are your compiled classes and your dependency JARs inside a Spring Boot executable JAR?

<details>
<summary>Answer</summary>

Your classes and resources are in `BOOT-INF/classes`; dependency JARs are nested under `BOOT-INF/lib`. The loader classes sit at the root, and the manifest points to `JarLauncher` as `Main-Class` and your application class as `Start-Class`.

</details>
