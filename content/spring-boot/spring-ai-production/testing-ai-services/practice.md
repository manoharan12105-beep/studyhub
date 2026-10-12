# Testing AI Services — Practice

### P1. Which layer?

**Difficulty:** Easy · **Type:** MCQ

"The service shows a friendly message when the model returns an empty answer." Where is this best tested?

- A) Nightly evaluation against the real model
- B) Unit test with a stub `ChatModel` returning a blank reply
- C) Manual testing in staging
- D) It cannot be tested

<details>
<summary>Answer</summary>

**Answer:** B) Unit test with a stub `ChatModel` returning a blank reply

</details>

### P2. Write a stub

**Difficulty:** Easy · **Type:** Coding

Write a `ChatModel` lambda that always replies "OK" and records the last prompt in an `AtomicReference<Prompt>`.

<details>
<summary>Answer</summary>

```java
// Illustrative fragment
AtomicReference<Prompt> last = new AtomicReference<>();
ChatModel stub = prompt -> {
    last.set(prompt);
    return new ChatResponse(List.of(new Generation(new AssistantMessage("OK"))));
};
ChatClient client = ChatClient.builder(stub).build();
```

</details>

### P3. Flaky test

**Difficulty:** Medium · **Type:** Debugging

```java
// Illustrative fragment
@Test
void explainsRecords() {
    assertThat(tutorService.explain("records")).isEqualTo("Records are immutable data carriers.");
}
```

The test uses the real OpenAI model and fails about once a day. Why, and how do you fix it?

<details>
<summary>Answer</summary>

Model output varies between calls and model versions, so exact-string assertions are flaky — and the test also depends on the network, a key and quota. For the unit test, use a stub `ChatModel` and assert on your code's behaviour; move quality checks to a tagged evaluation suite with property-based assertions or evaluators.

</details>

### P4. Test the tool loop

**Difficulty:** Medium · **Type:** Coding

Using the course's `ScriptedChatModel`, write a test that the assistant calls `latestGrade` and returns the final answer.

<details>
<summary>Answer</summary>

```java
// Illustrative fragment
@Test
void callsTheGradeToolThenAnswers() {
    var model = new ScriptedChatModel()
            .replyWithToolCall("latestGrade", "{}")
            .reply("Your latest grade is A.");
    String answer = ChatClient.create(model).prompt().user("What's my grade?")
            .tools(new GradeTools()).call().content();

    assertThat(answer).isEqualTo("Your latest grade is A.");
    assertThat(model.prompts()).hasSize(2);                       // tool round + final answer
    assertThat(model.prompts().get(1).getInstructions()).hasSize(3); // USER, ASSISTANT(tool call), TOOL
}
```

</details>

### P5. CI design

**Difficulty:** Hard · **Type:** Scenario

CI currently runs 300 tests, 40 of which call the real provider, taking 12 minutes and costing money on every push. Propose a new setup.

<details>
<summary>Answer</summary>

Convert the 40 tests: those checking your code (prompts, parsing, fallbacks, tools) become stub-`ChatModel` unit tests; those checking wiring use a local stub HTTP server or Testcontainers with a local model; those checking quality become a tagged evaluation suite run nightly and before releases with a budget. Every push runs unit + integration tests in a couple of minutes without secrets; failures in evaluations open issues rather than blocking every push, but block releases.

</details>
