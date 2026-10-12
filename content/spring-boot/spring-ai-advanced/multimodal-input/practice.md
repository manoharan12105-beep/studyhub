# Multimodal Input: Images and Files in Prompts — Practice

### P1. Where does media go?

**Difficulty:** Easy · **Type:** MCQ

Which message type carries user-supplied images in Spring AI?

- A) `SystemMessage`
- B) `UserMessage`
- C) `ToolResponseMessage`
- D) `AssistantMessage`

<details>
<summary>Answer</summary>

**Answer:** B) `UserMessage`

</details>

### P2. Attach two images

**Difficulty:** Easy · **Type:** Coding

Send "Compare these two screenshots" with `before.png` and `after.png` (both `Resource`s).

<details>
<summary>Answer</summary>

```java
// Illustrative fragment
String answer = chatClient.prompt()
        .user(u -> u.text("Compare these two screenshots.")
                .media(MimeTypeUtils.IMAGE_PNG, before)
                .media(MimeTypeUtils.IMAGE_PNG, after))
        .call().content();
```

</details>

### P3. Rejected upload

**Difficulty:** Medium · **Type:** Behavior

The lesson's `validate` method receives the bytes of a text file declared as `image/png`. What happens?

<details>
<summary>Answer</summary>

`ImageIO.read` returns `null`, so it throws `IllegalArgumentException("Not a readable image")` — the declared type alone is not trusted.

</details>

### P4. Slow and expensive

**Difficulty:** Medium · **Type:** Debugging

A photo-triage feature takes 9 seconds per request and costs far more than estimated. Uploads are 4000 × 3000 phone photos. What do you change?

<details>
<summary>Answer</summary>

Downscale images before sending (for example to the longest side the model needs for the task), compress to JPEG with reasonable quality, and measure token usage per image; check whether the provider has a low-detail mode; re-run the evaluation to confirm accuracy is unchanged.

</details>

### P5. Privacy review

**Difficulty:** Hard · **Type:** Scenario

A support assistant accepts screenshots. Reviewers find screenshots with customers' bank details stored in chat memory for 90 days. What do you change?

<details>
<summary>Answer</summary>

Don't store media in chat memory unless required — keep only the model's text summary; set retention for uploads and memory; warn users and, where possible, detect and redact sensitive regions before sending; confirm the provider's data-retention terms; delete existing stored images per policy; document the data flow.

</details>
