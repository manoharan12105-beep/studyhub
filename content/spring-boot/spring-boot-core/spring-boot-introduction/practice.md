# What Is Spring Boot? — Practice

### P1. What Boot adds

**Difficulty:** Easy · **Type:** MCQ

Which of these is provided by Spring Boot rather than Spring Framework?

- A) Dependency injection
- B) `@Transactional` support
- C) Auto-configuration and starters
- D) `DispatcherServlet`

<details>
<summary>Answer</summary>

**Answer:** C) Auto-configuration and starters

**Explanation:** DI, transactions and `DispatcherServlet` are Spring Framework; Boot configures them automatically.

</details>

### P2. Unexpected startup failure

**Difficulty:** Medium · **Type:** Debugging

A developer adds `spring-boot-starter-data-jpa` to explore it later. The application now fails: "Failed to configure a DataSource: 'url' attribute is not specified and no embedded datasource could be configured." Why?

<details>
<summary>Answer</summary>

The starter puts Hibernate and JDBC support on the classpath, so `DataSource` auto-configuration activates and needs a URL (or an embedded database such as H2 on the classpath). Either configure `spring.datasource.url`, add an embedded database for development, or remove the starter until it is needed.

</details>

### P3. Architecture explanation

**Difficulty:** Medium · **Type:** Conceptual

In three sentences, explain where Spring Boot sits between your code and the JVM.

<details>
<summary>Answer</summary>

Your controllers, services and repositories run on the Spring Framework container (DI, MVC, transactions). Spring Boot sits on top of Spring: it starts the application, builds the `Environment`, auto-configures infrastructure beans and the embedded server, and adds Actuator. Below Spring are libraries (Hibernate, Jackson, Tomcat, HikariCP) and the JVM.

</details>

### P4. Monolith or microservice

**Difficulty:** Easy · **Type:** Conceptual

Your interviewer says, "So you used Spring Boot, which means your project was microservices?" Respond.

<details>
<summary>Answer</summary>

Not necessarily — Spring Boot is a way to build and run Spring applications, suitable for monoliths too. Describe your actual architecture (for example a single Boot application with layered packages) and mention that microservice concerns such as service discovery or gateways would come from Spring Cloud.

</details>
