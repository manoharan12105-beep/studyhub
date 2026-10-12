# Prompt Injection and Untrusted Input — Practice

### P1. Safest placement

**Difficulty:** Easy · **Type:** MCQ

Where should text uploaded by a user go in a Spring AI prompt?

- A) Concatenated into the system message
- B) Concatenated into the user template string
- C) As a template parameter value inside delimiters in the user message
- D) In the model options

<details>
<summary>Answer</summary>

**Answer:** C) As a template parameter value inside delimiters in the user message

</details>

### P2. Strongest control

**Difficulty:** Easy · **Type:** MCQ

Which control best limits the damage of a successful prompt injection in an assistant with tools?

- A) A longer system prompt
- B) A blocklist of phrases like "ignore previous instructions"
- C) Least-privileged tools that check the real user's permissions in code
- D) A higher temperature

<details>
<summary>Answer</summary>

**Answer:** C) Least-privileged tools that check the real user's permissions in code

</details>

### P3. Find the flaws

**Difficulty:** Medium · **Type:** Code analysis

```java
// Illustrative fragment
String answer = chatClient.prompt()
        .system("You are a support bot. Customer notes: " + customer.notes())
        .user(u -> u.text("Question: " + request.question()))
        .call().content();
return ResponseEntity.ok(markdownRenderer.toHtml(answer));
```

List three problems.

<details>
<summary>Answer</summary>

1. Customer-controlled notes are concatenated into the **system** message, giving them instruction-level authority.
2. The question is concatenated into the template source; braces can break rendering and it is not delimited as data.
3. The answer is rendered as HTML/Markdown without checks, so injected links or images can exfiltrate data (and HTML can be unsafe).

Fix: system message with fixed instructions; notes and question as fenced `.param(...)` values in the user message; render as plain text or sanitise and block external links/images.

</details>

### P4. Write the fence

**Difficulty:** Medium · **Type:** Coding

Write `fence(String tag, String untrusted)` that wraps text in `<tag>` … `</tag>` and prevents the text from closing the block early.

<details>
<summary>Answer</summary>

```java
// Illustrative fragment
static String fence(String tag, String untrusted) {
    String close = "</" + tag + ">";
    return "<" + tag + ">\n" + untrusted.replace(close, "[removed tag]") + "\n" + close;
}
```

Pair it with a system instruction that the tagged content is data, and remember it reduces injection rather than preventing it.

</details>

### P5. Indirect injection incident

**Difficulty:** Hard · **Type:** Scenario

A RAG assistant over the company wiki starts telling users to reset their passwords on an external site. The model, prompts and code have not changed. What happened and how do you respond?

<details>
<summary>Answer</summary>

A wiki page (or an ingested document) now contains injected instructions that are retrieved as context — indirect injection. Respond by finding the document through the retrieved-document logs, removing it from the vector store and the source, and checking who can edit ingested sources. Harden: restrict and review ingestion sources, fence retrieved context, check output for external links against an allow-list, and add this case to the evaluation set.

</details>
