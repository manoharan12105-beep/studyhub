# Conversation IDs and Session Isolation — Practice

### P1. Safe id scheme

**Difficulty:** Easy · **Type:** MCQ

Which conversation id scheme isolates users correctly?

- A) The constant `"chat"`
- B) The conversation id sent by the browser, used as-is
- C) `authenticatedUserId + ":" + conversationId`, built on the server
- D) The current date

<details>
<summary>Answer</summary>

**Answer:** C) `authenticatedUserId + ":" + conversationId`, built on the server

</details>

### P2. Missing id

**Difficulty:** Easy · **Type:** MCQ

In Spring AI 2.0, what happens when a memory advisor runs without `ChatMemory.CONVERSATION_ID`?

- A) It uses `"default"`
- B) It skips memory silently
- C) It throws `IllegalArgumentException`
- D) It generates a random id

<details>
<summary>Answer</summary>

**Answer:** C) It throws `IllegalArgumentException`

</details>

### P3. Review the controller

**Difficulty:** Medium · **Type:** Code analysis

```java
// Illustrative fragment
@PostMapping("/chat/{conversationId}")
String chat(@PathVariable String conversationId, @RequestBody String message) {
    return chatClient.prompt().user(message)
            .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, conversationId))
            .call().content();
}
```

What is the security problem and how do you fix it?

<details>
<summary>Answer</summary>

Any caller can pass any id and continue (and read through the model) another user's conversation. Get the user from the security context (`Authentication`/`Principal`) and build the key as `userId + ":" + conversationId`, or verify ownership in a conversations table before using the id.

</details>

### P4. Write the key builder

**Difficulty:** Medium · **Type:** Coding

Write a method `conversationKey(String tenantId, String userId, String requestedId)` that returns `tenant:user:id`, generates a new UUID when `requestedId` is blank, and allows only letters, digits and hyphens in the requested part.

<details>
<summary>Answer</summary>

```java
// Illustrative fragment
static String conversationKey(String tenantId, String userId, String requestedId) {
    String conversation = (requestedId == null || requestedId.isBlank())
            ? UUID.randomUUID().toString()
            : requestedId.replaceAll("[^A-Za-z0-9-]", "");
    return tenantId + ":" + userId + ":" + conversation;
}
```

`tenantId` and `userId` must come from authentication, not from the request.

</details>

### P5. Incident analysis

**Difficulty:** Hard · **Type:** Scenario

A user reports that the assistant mentioned "your order ORD-77 from yesterday", but they never placed that order. Logs show both users used the same mobile app build. Describe how you would investigate and fix.

<details>
<summary>Answer</summary>

Suspect shared memory: check how the app builds conversation ids (a hard-coded id, an id cached in a shared component, or a client-provided id without an ownership check). Inspect the conversation id in traces (`spring.ai.chat.client.conversation.id`) for both users. Fix by building ids on the server from the authenticated user, clear the affected conversation, add a test that two users never share memory, and treat it as a data-protection incident (notify according to policy).

</details>
