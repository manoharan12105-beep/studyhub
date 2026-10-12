# Project 1: Study Assistant — Practice

### P1. Memory key

**Difficulty:** Easy · **Type:** MCQ

Where should the conversation id for `explain` come from?

- A) A `conversationId` field in the request body
- B) The authenticated principal's name
- C) A random UUID per request
- D) The model's reply

<details>
<summary>Answer</summary>

**Answer:** B) The authenticated principal's name

A body field lets one learner read another's history. A random id per request gives the model no memory at all.

</details>

### P2. Count the messages

**Difficulty:** Easy · **Type:** Behavior

With the lesson's service, a learner asks a third question in the same conversation. How many messages does the model receive?

<details>
<summary>Answer</summary>

Six: the system message, the two earlier questions, the two earlier answers, and the new question. The memory window (`maxMessages(20)`) is not reached yet.

</details>

### P3. Add a difficulty level

**Difficulty:** Medium · **Type:** Coding

Extend `quiz` so the caller chooses `EASY`, `MEDIUM` or `HARD`, and the prompt includes it safely.

<details>
<summary>Answer</summary>

```java
// Illustrative fragment
enum Level { EASY, MEDIUM, HARD }

QuizQuestion quiz(String topic, Level level) {
    validate(topic);
    QuizQuestion q = client.prompt()
            .user(u -> u.text("Write one {level} multiple-choice question about {topic} with four options.")
                    .param("topic", topic)
                    .param("level", level.name().toLowerCase()))
            .call().entity(QuizQuestion.class);
    // same invariant checks as before
    return q;
}
```

An enum limits the value to three known words, so the parameter cannot carry injected instructions.

</details>

### P4. Bad JSON in production

**Difficulty:** Medium · **Type:** Debugging

About 1 in 200 quiz requests fails with a parse exception from `.entity(...)`. What do you do?

<details>
<summary>Answer</summary>

- **Short term:** catch the exception, retry once, and return a clear "try again" error to the user.
- **Longer term:** use the provider's native structured output if it is supported, lower the temperature, and keep the invariant checks.
- **Monitoring:** log the failure rate (not the content), and add the failing cases to the evaluation set.

</details>

### P5. Test without a key

**Difficulty:** Medium · **Type:** Coding

Write a JUnit test proving that a blank question never reaches the model.

<details>
<summary>Answer</summary>

```java
// Illustrative fragment
@Test
void blankQuestionIsRejectedBeforeTheModel() {
    ScriptedChatModel model = new ScriptedChatModel();
    StudyAssistant assistant = new StudyAssistant(ChatClient.builder(model), MessageWindowChatMemory.builder().build());

    assertThrows(IllegalArgumentException.class, () -> assistant.explain("learner-1", "  "));
    assertEquals(0, model.prompts().size());
}
```

</details>
