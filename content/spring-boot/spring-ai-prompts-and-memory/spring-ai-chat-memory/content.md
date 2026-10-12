# Chat Memory: Stateless Models and Application-Managed History

**Module:** Spring AI: Prompts and Conversations · **Interview priority:** Core · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Explain why chat models are stateless and what "memory" really means.
- Distinguish chat memory (what the model sees) from chat history (the full record).
- Use `ChatMemory`, `MessageWindowChatMemory` and `MessageChatMemoryAdvisor`.
- Manage memory manually when calling `ChatModel` directly.

## Definition

Chat models are **stateless**: each request is independent, and the model knows only the messages in that request. **Chat memory** is the subset of earlier messages your application resends so the model can follow the conversation. In Spring AI, the `ChatMemory` interface decides *which* messages to keep (the default `MessageWindowChatMemory` keeps the last N), and a `ChatMemoryRepository` stores them (in memory, JDBC, Redis, …). `MessageChatMemoryAdvisor` loads and saves memory automatically around each `ChatClient` call.

**Chat history** is different: the complete record of all messages for auditing or display. The Spring AI documentation recommends storing full history separately (for example with Spring Data), because `ChatMemory` deliberately forgets.

## Why It Matters

Without memory, "What about TreeMap?" after a question about HashMap makes no sense to the model. With unlimited memory, every request grows until it costs too much or exceeds the context window. Memory design decides cost, quality, privacy and isolation between users.

## How It Works

```text
Request 2 for conversation "priya:session-7"
  MessageChatMemoryAdvisor.before()
     └── chatMemory.get("priya:session-7") → [USER "I am Priya", ASSISTANT "Nice to meet you, Priya"]
     └── prompt = memory + new USER "What is my name?"
  ChatModel.call(prompt)
  MessageChatMemoryAdvisor.after()
     └── chatMemory.add("priya:session-7", [USER "What is my name?", ASSISTANT "Your name is Priya."])
```

| Component | Role | Default |
|-----------|------|---------|
| `ChatMemory` | Policy: which messages to keep | `MessageWindowChatMemory`, 20 messages |
| `ChatMemoryRepository` | Storage | `InMemoryChatMemoryRepository` (a `ConcurrentHashMap`) unless another repository is configured |
| `MessageChatMemoryAdvisor` | Loads memory into the prompt as messages, saves the new exchange | Order `HIGHEST_PRECEDENCE + 200` (outside the tool loop) |
| `ChatMemory.CONVERSATION_ID` | Advisor parameter that selects the conversation | **Required** on every call in 2.0 |

`MessageWindowChatMemory` evicts the oldest messages when the window is full, always keeps system messages (a new system message replaces older ones), and in 2.0 evicts **whole turns** so a window never starts mid-turn.

Spring Boot auto-configures a `ChatMemory` bean (`MessageWindowChatMemory` over the in-memory repository, or over JDBC/Redis/… when such a repository starter is present).

## Using Memory with ChatClient

```java
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.stereotype.Service;

@Service
class ConversationalTutor {

    private final ChatClient chatClient;

    ConversationalTutor(ChatClient.Builder builder, ChatMemory chatMemory) {
        this.chatClient = builder
                .defaultSystem("You are a friendly Java tutor.")
                .defaultAdvisors(MessageChatMemoryAdvisor.builder(chatMemory).build())
                .build();
    }

    String chat(String conversationId, String message) {
        return chatClient.prompt()
                .user(message)
                .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, conversationId))
                .call()
                .content();
    }
}
```

How to build the conversation id safely is the subject of [Conversation IDs and Session Isolation](../conversation-ids-and-isolation/content.md).

## Example

The same two questions, first without memory, then with `MessageChatMemoryAdvisor`, against the [Practice Lab](../../spring-ai-foundations/spring-ai-practice-lab/content.md) model. The output shows what the model actually received.

```java
import com.example.studyai.lab.ScriptedChatModel;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.ai.chat.messages.Message;

public class MemoryDemo {

    public static void main(String[] args) {
        // 1. No memory: every request stands alone
        ScriptedChatModel model = new ScriptedChatModel()
                .reply("Nice to meet you, Priya.")
                .reply("I don't know your name.");
        ChatClient stateless = ChatClient.create(model);
        stateless.prompt().user("I am Priya.").call().content();
        stateless.prompt().user("What is my name?").call().content();
        System.out.println("Without memory, request 2 sent " + model.lastPrompt().getInstructions().size() + " message(s)");

        // 2. With MessageChatMemoryAdvisor and an explicit conversation id
        ChatMemory memory = MessageWindowChatMemory.builder().maxMessages(10).build();
        ScriptedChatModel model2 = new ScriptedChatModel()
                .reply("Nice to meet you, Priya.")
                .reply("Your name is Priya.");
        ChatClient withMemory = ChatClient.builder(model2)
                .defaultAdvisors(MessageChatMemoryAdvisor.builder(memory).build())
                .build();
        String id = "priya:session-7";
        withMemory.prompt().user("I am Priya.").advisors(a -> a.param(ChatMemory.CONVERSATION_ID, id)).call().content();
        String answer = withMemory.prompt().user("What is my name?")
                .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, id)).call().content();

        System.out.println("With memory, request 2 sent:");
        for (Message m : model2.lastPrompt().getInstructions()) {
            System.out.println("  " + m.getMessageType() + ": " + m.getText());
        }
        System.out.println("Answer: " + answer);
        System.out.println("Stored for " + id + ": " + memory.get(id).size() + " messages");
    }
}
```

**Output:**

```text
Without memory, request 2 sent 1 message(s)
With memory, request 2 sent:
  USER: I am Priya.
  ASSISTANT: Nice to meet you, Priya.
  USER: What is my name?
Answer: Your name is Priya.
Stored for priya:session-7: 4 messages
```

### Code walkthrough

- Without memory the second request contains only the new question; a real model cannot know the name.
- With the advisor, `before` inserted the stored pair ahead of the new message and `after` saved the new exchange: 4 messages are now stored.
- The conversation id is passed on **every** call. Omitting it throws `IllegalArgumentException: conversationId cannot be null` in Spring AI 2.0.

## Memory Without ChatClient

With `ChatModel` you manage memory yourself — the same steps the advisor performs:

```java
// Illustrative fragment
chatMemory.add(conversationId, new UserMessage(question));
ChatResponse response = chatModel.call(new Prompt(chatMemory.get(conversationId)));
chatMemory.add(conversationId, response.getResult().getOutput());
```

## Common Mistakes and Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `IllegalArgumentException: conversationId cannot be null` | Memory advisor used without `ChatMemory.CONVERSATION_ID` | Pass the id on every call |
| Users see each other's context | A fixed or shared conversation id | Derive ids from the authenticated user and session |
| Memory lost on restart | Default in-memory repository | Use a persistent repository ([Memory Storage](../chat-memory-storage/content.md)) |
| Model "forgets" early facts in long chats | Window evicted them | Larger window, summaries, or long-term memory ([Long Conversations](../long-conversation-management/content.md)) |
| Need a full transcript for support | `ChatMemory` deliberately forgets | Store chat history separately |
| `PromptChatMemoryAdvisor` not found | Removed in 2.0 | Use `MessageChatMemoryAdvisor` |

## Production Considerations

- Memory contains personal data: define retention, deletion ("forget my conversation") and access rules.
- Every remembered message is resent and billed on every request; size the window by tokens, not just message count.
- Tool calls and memory interact: by default memory stores only the final user and assistant messages, not intermediate tool messages ([Chat Memory Advisors](../../spring-ai-tools-and-advisors/chat-memory-advisors/content.md)).

## Common Interview Traps

- **"The model remembers the conversation."** The application resends it.
- **"Chat memory is the chat history."** Memory is a bounded working set; history is the complete record.
- **"Spring AI provides a default conversation id."** Not in 2.0 — it is mandatory.

## Key Takeaways

- Models are stateless; memory = messages your app resends.
- `ChatMemory` (policy) + `ChatMemoryRepository` (storage) + `MessageChatMemoryAdvisor` (automation).
- Always pass a per-user, per-conversation `ChatMemory.CONVERSATION_ID`; store full history separately when you need it.

## Official References

- [Chat Memory](https://docs.spring.io/spring-ai/reference/api/chat-memory.html)
- [Advisors: chat memory advisors](https://docs.spring.io/spring-ai/reference/api/advisors.html)
- [Upgrade notes: conversation id is now required](https://docs.spring.io/spring-ai/reference/upgrade-notes.html)
