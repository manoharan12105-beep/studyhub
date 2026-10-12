# Conversation IDs and Session Isolation

**Module:** Spring AI: Prompts and Conversations · **Interview priority:** Core · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Explain why the conversation id is the only thing that separates one conversation's memory from another.
- Derive conversation ids on the server from the authenticated user, never trust them blindly from clients.
- Support several conversations per user, list them and delete them safely.
- Recognise the cross-user leak caused by shared ids.

## Definition

A **conversation id** is the key under which `ChatMemory` stores and loads messages. Every memory operation — `get`, `add`, `clear` — and every memory advisor call (`ChatMemory.CONVERSATION_ID`, whose value is the string `chat_memory_conversation_id`) is scoped by it. **Session isolation** means that a user can only ever load, extend or delete conversations that belong to them.

## Why It Matters

Memory is resent to the model on every request. If two users share an id, user B's prompt contains user A's messages — personal data, order numbers, anything A typed — and the model may repeat them to B. Because Spring AI does not know your users, the id scheme is entirely your responsibility; Spring AI 2.0 makes it impossible to forget by requiring the id on every call.

## How It Works

1. Authenticate the user (Spring Security) — the user id comes from the security context, not from the request body.
2. Choose a conversation key inside that user's namespace, for example `userId + ":" + conversationId`.
3. When the client sends a conversation id (to continue a chat), check that it belongs to the user, or simply always prefix it with the user id on the server.
4. Pass the final id with `.advisors(a -> a.param(ChatMemory.CONVERSATION_ID, id))`.
5. For listing and deleting, operate only on ids with the user's prefix (`ChatMemoryRepository.findConversationIds()` returns all ids, so filter).

| Id scheme | Isolation | Notes |
|-----------|-----------|-------|
| Constant (`"default"`, `"chat"`) | None — everyone shares one memory | The 1.x default; removed in 2.0 for this reason |
| Client-chosen raw id | Weak — guessable or tamperable | Never trust without an ownership check |
| `userId:conversationId` built on the server | Strong | User id from the security context |
| `userId:sessionId` | Strong, one conversation per session | Simple for anonymous-but-sessioned users |

## Example

A conversation-id policy plus a demonstration of what goes wrong with a shared id:

```java
import java.util.List;
import java.util.UUID;

import com.example.studyai.lab.ScriptedChatModel;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.InMemoryChatMemoryRepository;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.ai.chat.messages.Message;

public class ConversationIsolationDemo {

    /** Server-side policy: the user id always comes from authentication, never from the client. */
    static String conversationKey(String authenticatedUserId, String clientConversationId) {
        String conversation = (clientConversationId == null || clientConversationId.isBlank())
                ? UUID.nameUUIDFromBytes("new".getBytes()).toString()
                : clientConversationId.replaceAll("[^A-Za-z0-9-]", "");
        return authenticatedUserId + ":" + conversation;
    }

    static String ask(ChatClient client, String conversationId, String text) {
        return client.prompt().user(text)
                .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, conversationId))
                .call().content();
    }

    public static void main(String[] args) {
        var repository = new InMemoryChatMemoryRepository();
        ChatMemory memory = MessageWindowChatMemory.builder().chatMemoryRepository(repository).build();
        ScriptedChatModel model = new ScriptedChatModel().reply("ok").reply("ok").reply("ok").reply("ok");
        ChatClient client = ChatClient.builder(model)
                .defaultAdvisors(MessageChatMemoryAdvisor.builder(memory).build())
                .build();

        // Bug: one constant id for everyone
        ask(client, "chat", "My order ORD-1001 is late, my phone is 555-0101.");    // user Asha
        ask(client, "chat", "Hi, I need help with my course.");                       // user Ben
        List<Message> sentForBen = model.lastPrompt().getInstructions();
        System.out.println("Shared id: Ben's request contained " + sentForBen.size() + " messages, first: "
                + sentForBen.get(0).getText());

        // Fix: per-user keys built on the server
        String asha = conversationKey("asha", "c-1");
        String ben = conversationKey("ben", "c-1");          // same client id, different user
        ask(client, asha, "My order ORD-1001 is late.");
        ask(client, ben, "Hi, I need help with my course.");
        System.out.println("Per-user ids: Ben's request contained " + model.lastPrompt().getInstructions().size() + " message");
        System.out.println("Keys: " + asha + " / " + ben);
        System.out.println("Tampered client id becomes: " + conversationKey("ben", "../asha:c-1"));

        List<String> bensConversations = repository.findConversationIds().stream()
                .filter(id -> id.startsWith("ben:")).sorted().toList();
        System.out.println("Ben can list: " + bensConversations);
    }
}
```

**Output:**

```text
Shared id: Ben's request contained 3 messages, first: My order ORD-1001 is late, my phone is 555-0101.
Per-user ids: Ben's request contained 1 message
Keys: asha:c-1 / ben:c-1
Tampered client id becomes: ben:ashac-1
Ben can list: [ben:c-1]
```

### Code walkthrough

- With the constant id `"chat"`, Ben's request carried Asha's order number and phone number to the model — a data leak, even though no code "showed" it to Ben.
- `conversationKey(...)` always prefixes the authenticated user id and strips unexpected characters from the client part, so a tampered id stays inside Ben's namespace.
- Listing filters by the user's prefix; deletion should use the same rule (`chatMemory.clear(key)` only for keys the user owns).
- In a real controller the user id comes from Spring Security (`Authentication#getName()` or a JWT claim), not from a request parameter ([Authentication Architecture](../../security/authentication-architecture/content.md)).

## Common Mistakes and Troubleshooting

- **Using the HTTP session id alone across devices.** Users lose context when switching devices; use a user-scoped id if continuity matters.
- **Accepting `conversationId` from the client and using it directly.** An attacker can guess or reuse another user's id; always combine with or check against the authenticated user.
- **Listing all conversation ids.** `findConversationIds()` returns every id in the store; filter by owner.
- **Logging conversation ids together with prompt text.** Ids are not secret, but logs then link users to content; follow your logging rules ([Logging Without Secrets](../../spring-ai-production/ai-logging-and-sensitive-data/content.md)).

## Production Considerations

- Treat conversation ids like any resource id: authorization on every read, write and delete.
- Multi-tenant systems add the tenant: `tenantId:userId:conversationId`.
- Define retention: delete or expire old conversations (Redis TTL, scheduled JDBC cleanup).
- Observability records `spring.ai.chat.client.conversation.id` as a high-cardinality trace attribute; make sure your tracing backend's access rules fit that.

## Common Interview Traps

- **"The conversation id is a UI detail."** It is the security boundary of chat memory.
- **"Spring Security isolates memory automatically."** Spring AI does not know your users; you build the key.
- **"A random UUID from the client is safe."** Only if you also verify that it belongs to the caller.

## Key Takeaways

- The conversation id alone scopes memory; Spring AI 2.0 requires it on every memory call.
- Build ids on the server from the authenticated user (and tenant); never trust client ids without an ownership check.
- Filter listing and deletion by owner; plan retention.

## Official References

- [Chat Memory: working with conversation IDs](https://docs.spring.io/spring-ai/reference/api/chat-memory.html)
- [Upgrade notes: conversation ID is now required](https://docs.spring.io/spring-ai/reference/upgrade-notes.html)
