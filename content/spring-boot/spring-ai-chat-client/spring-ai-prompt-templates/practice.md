# Prompt Templates and Dynamic Inputs — Practice

### P1. Default placeholder syntax

**Difficulty:** Easy · **Type:** MCQ

Which placeholder is recognised by the default `StTemplateRenderer`?

- A) `${topic}`
- B) `{{topic}}`
- C) `{topic}`
- D) `#topic#`

<details>
<summary>Answer</summary>

**Answer:** C) `{topic}`

</details>

### P2. Predict the failure

**Difficulty:** Medium · **Type:** MCQ

What happens here?

```java
// Illustrative fragment
chatClient.prompt()
        .user(u -> u.text("Return {\"ok\": true} if {name} is valid.").param("name", "Priya"))
        .call().content();
```

- A) The JSON is sent unchanged and `{name}` becomes `Priya`
- B) `IllegalArgumentException: The template string is not valid.`
- C) The braces are silently removed
- D) The model receives `{name}` literally

<details>
<summary>Answer</summary>

**Answer:** B) `IllegalArgumentException: The template string is not valid.`

**Explanation:** With parameters present, the template text is parsed and the literal JSON braces break it. Use custom delimiters or pass the JSON as a value.

</details>

### P3. Safe user input

**Difficulty:** Medium · **Type:** Code analysis

Which version is safer, and why?

```java
// Illustrative fragment
// Version 1
.user("Summarise this review: " + review)
// Version 2
.user(u -> u.text("Summarise the review between the markers.\n<<<\n{review}\n>>>").param("review", review))
```

<details>
<summary>Answer</summary>

Version 2. The review is a template *value*, so braces in it cannot break rendering, and the delimiters make clear to the model where data starts and ends. It does not fully prevent prompt injection, but it keeps structure and data separate.

</details>

### P4. Prompt file

**Difficulty:** Medium · **Type:** Coding

Load `classpath:/prompts/quiz-system-v1.st` (which contains `{count}`) as the default system prompt and send a request with `count = 5`.

<details>
<summary>Answer</summary>

```java
// Illustrative fragment
QuizService(ChatClient.Builder builder,
            @Value("classpath:/prompts/quiz-system-v1.st") Resource quizSystem) {
    this.chatClient = builder.defaultSystem(quizSystem).build();
}

String quiz(String topic) {
    return chatClient.prompt()
            .system(s -> s.param("count", 5))
            .user(topic)
            .call()
            .content();
}
```

</details>

### P5. Prompt change management

**Difficulty:** Hard · **Type:** Design

Your team edits the tutor prompt often and answers sometimes get worse. Propose a process using prompt files.

<details>
<summary>Answer</summary>

Store each prompt as a versioned file (`tutor-system-v3.st`) and select the active version by configuration; review changes in pull requests; render every prompt in unit tests; run an evaluation dataset against the old and new versions before switching; log the prompt version with each response so regressions can be traced; keep the previous version deployable for instant rollback.

</details>
