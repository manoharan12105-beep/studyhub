# Conversation IDs and Session Isolation — Interview Questions

## Beginner

### Q1. What is a conversation id in Spring AI chat memory?

**Style:** Direct

<details>
<summary>Answer</summary>

The key under which `ChatMemory` stores and loads a conversation's messages. Memory advisors read it from the advisor parameter `ChatMemory.CONVERSATION_ID` on every call; in 2.0 it is mandatory.

</details>

### Q2. What happens if all users share one conversation id?

**Style:** What happens if

<details>
<summary>Answer</summary>

All their messages go into one memory, so each user's request carries other users' messages to the model. Personal data can leak in answers, and conversations get mixed up. This is why 2.0 removed the default id.

</details>

## Intermediate

### Q3. How should a conversation id be built in a multi-user web application?

**Style:** How

<details>
<summary>Answer</summary>

On the server, from the authenticated principal: for example `userId + ":" + conversationId` (plus a tenant prefix in multi-tenant systems). The user id comes from Spring Security, not from the request. If the client sends a conversation id to continue a chat, it is sanitised and placed inside the user's namespace, or checked for ownership.

</details>

### Q4. A client sends `conversationId` in the request body. Is it safe to use?

**Style:** Trap

<details>
<summary>Answer</summary>

Not by itself. An attacker can send another user's id and read their memory through the model or append to it. Use it only after combining it with the authenticated user id or verifying ownership in your own conversation table.

</details>

### Q5. How do you list and delete a user's conversations?

**Style:** How

<details>
<summary>Answer</summary>

`ChatMemoryRepository.findConversationIds()` returns every id in the store, so filter by the user's prefix (or keep your own conversations table per user). Delete with `chatMemory.clear(id)` or `deleteByConversationId(id)` only after checking the id belongs to the caller; also delete any separately stored chat history.

</details>

## Advanced

### Q6. How would you design conversation ids for a multi-tenant SaaS with anonymous trial users?

**Style:** Design

<details>
<summary>Answer</summary>

Signed-in users: `tenantId:userId:conversationUuid`, all parts from the security context except the conversation UUID, which is validated as belonging to that user. Anonymous users: `tenantId:anon:sessionId`, scoped to the HTTP session with a short TTL, and no access to stored conversations after the session ends. Apply the same ownership rule to listing, deleting and observability data access, and expire old conversations automatically.

</details>
