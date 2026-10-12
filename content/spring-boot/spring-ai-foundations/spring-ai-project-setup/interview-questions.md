# Project Setup: Spring Initializr, BOM and Starters — Interview Questions

## Beginner

### Q1. What is the minimum you need in a Maven project to use Spring AI with OpenAI?

**Style:** Direct

<details>
<summary>Answer</summary>

A Spring Boot 4.x parent (for Spring AI 2.0), the `spring-ai-bom` imported in `dependencyManagement`, the `spring-ai-starter-model-openai` dependency without a version, and the API key in configuration (`spring.ai.openai.api-key=${OPENAI_API_KEY}`).

</details>

### Q2. What does a BOM do, and what does it not do?

**Style:** Direct

<details>
<summary>Answer</summary>

A BOM (bill of materials) declares compatible versions for a set of artifacts so you can omit versions on those dependencies. It does not add any dependency by itself; you still declare the starters and modules you use.

</details>

## Intermediate

### Q3. Which dependencies would you add for a RAG feature on PostgreSQL that answers from PDF manuals?

**Style:** Scenario

<details>
<summary>Answer</summary>

A model starter that provides chat and embedding models (for example `spring-ai-starter-model-openai`), `spring-ai-starter-vector-store-pgvector` (plus a PostgreSQL database with the pgvector extension), `spring-ai-vector-store-advisor` for `QuestionAnswerAdvisor` (or `spring-ai-rag` for `RetrievalAugmentationAdvisor`), and `spring-ai-pdf-document-reader` for ingestion.

</details>

### Q4. Why disable model types such as image or audio when you do not use them?

**Style:** Why

<details>
<summary>Answer</summary>

A provider starter can auto-configure many model beans. Setting `spring.ai.model.image=none` (and similar) avoids creating unused clients, keeps startup and the bean graph smaller, removes ambiguity when several providers are present, and documents which capabilities the service really uses.

</details>

### Q5. How do you find out which AI beans Spring Boot created and why?

**Style:** Debugging

<details>
<summary>Answer</summary>

List bean names and types from the `ApplicationContext` (or use the Actuator `beans` endpoint in development), and start with `--debug` to print the condition evaluation report, which shows each auto-configuration that matched or did not and the condition responsible.

</details>

## Advanced

### Q6. The build fails with "Could not find artifact org.springframework.ai:spring-ai-advisors-vector-store". What happened?

**Style:** Debugging

<details>
<summary>Answer</summary>

The project uses the Spring AI 2.0 BOM with a 1.x artifact name. In 2.0 the module was renamed `spring-ai-vector-store-advisor`, so the BOM manages no version for the old name and Maven cannot resolve it. Rename the dependency (or, on Spring Boot 3, use the 1.1.x BOM where the old name exists).

</details>
