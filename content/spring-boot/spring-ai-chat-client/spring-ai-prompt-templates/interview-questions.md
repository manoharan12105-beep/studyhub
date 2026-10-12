# Prompt Templates and Dynamic Inputs — Interview Questions

## Beginner

### Q1. What is a prompt template in Spring AI?

**Style:** Direct

<details>
<summary>Answer</summary>

Prompt text with named placeholders (`{topic}` by default) that are filled at runtime. `PromptTemplate` renders it through a `TemplateRenderer` — by default `StTemplateRenderer`, based on StringTemplate. `ChatClient` uses the same mechanism for `system(s -> s.text(..).param(..))` and `user(u -> u.text(..).param(..))`.

</details>

### Q2. Why keep prompts in resource files?

**Style:** Why

<details>
<summary>Answer</summary>

Prompts define behaviour. As versioned files (`prompts/tutor-system-v2.st`) they are reviewed in pull requests, diffed, tested and rolled back like code, they can be compared across versions in evaluations, and service classes stay short. They are injected as `Resource` and passed to `defaultSystem(resource)` or `user(resource)`.

</details>

## Intermediate

### Q3. What happens when a template variable has no value?

**Style:** What happens if

<details>
<summary>Answer</summary>

With the default validation mode (`THROW`) rendering fails with `IllegalStateException: Not all variables were replaced in the template. Missing variable names are: [...]`. One subtlety with `ChatClient`: if the request supplies no parameters at all, the text is not rendered and the placeholder is sent literally.

</details>

### Q4. How do you include a JSON example in a template?

**Style:** How

<details>
<summary>Answer</summary>

Either pass the JSON as a variable *value* (values are not parsed), or switch delimiters with `StTemplateRenderer.builder().startDelimiterToken('<').endDelimiterToken('>').build()` — on the request with `templateRenderer(...)` or on the builder with `defaultTemplateRenderer(...)` — so braces in the template text are ordinary characters.

</details>

### Q5. Does setting `templateRenderer(...)` on `ChatClient` affect `QuestionAnswerAdvisor`'s prompt?

**Style:** Trap

<details>
<summary>Answer</summary>

No. It only affects the system and user text defined in the `ChatClient` chain. Advisors that build prompts, such as `QuestionAnswerAdvisor`, accept their own `PromptTemplate` (with its own renderer) through their builders.

</details>

## Advanced

### Q6. How would you test a prompt template without calling a model?

**Style:** How

<details>
<summary>Answer</summary>

Render it with `PromptTemplate.render(...)` and assert the exact text, including that every placeholder is filled; or send it through `ChatClient` backed by a scripted `ChatModel` and assert the recorded prompt. Add a test per prompt file that renders it with representative values, so a renamed placeholder breaks the build rather than production.

</details>
