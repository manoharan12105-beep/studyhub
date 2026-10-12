# Long Conversations: Windows, Summaries and Context Limits

**Module:** Spring AI: Prompts and Conversations · **Interview priority:** Frequently asked · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Explain why a long conversation eventually breaks: context limits, cost, latency and diluted instructions.
- Size `MessageWindowChatMemory` and predict which messages it keeps, including turn-boundary eviction.
- Implement a summarising strategy that compresses older turns into one message.
- Choose between a window, a summary, retrieval over past messages, and starting a new conversation.

## Definition

**Long-conversation management** is the policy that decides which parts of a conversation are resent to the model on each request. Because the model is stateless, every remembered message costs input tokens on every call; the policy trades recall of older details against context-window limits, cost and latency.

## Why It Matters

Without a limit, a conversation grows until the request exceeds the model's context window and the provider rejects it. Long before that, each turn gets slower and more expensive, and the system instructions compete with hundreds of older messages. Every production chat feature needs an explicit answer to "what happens at message 200?".

## How It Works

| Strategy | What the model sees | Strength | Weakness |
|----------|---------------------|----------|----------|
| Sliding window (`MessageWindowChatMemory`) | System messages + newest whole turns | Simple, predictable size | Forgets early facts completely |
| Summary + window (your code) | A summary message + newest turns | Keeps key facts cheaply | Summary costs a model call and can lose or distort details |
| Retrieval over past messages (`VectorStoreChatMemoryAdvisor`) | Past messages similar to the current question | Recalls old details on demand | Needs a vector store; misses facts that do not look similar |
| New conversation | Only what you carry over explicitly | Clean context | User must restate context |

### Window behaviour in 2.0.1

- The default window is 20 messages; `MessageWindowChatMemory.builder().maxMessages(n)` changes it.
- `SystemMessage`s are always preserved and count towards the limit.
- Eviction removes **whole turns**: a turn starts at a `UserMessage` and runs to the next one. If the raw cut lands inside a turn, it moves forward to the next user message, so the actual count can be below `maxMessages`.
- If `maxMessages` is smaller than one turn (for example a long tool exchange), all non-system messages can be evicted. Size the window to hold at least one realistic turn.

### Counting the cost

Input tokens per call ≈ system prompt + remembered messages + new user message (+ retrieved documents and tool definitions). With a window of 20 messages averaging 60 tokens each, every call carries about 1,200 tokens of history before the user even asks anything. Use the usage metadata (`chatResponse.getMetadata().getUsage()`) to measure it rather than guessing.

## Example

A window that keeps the newest turns, then a summarising compaction that replaces older turns with one message. `ScriptedChatModel` stands in for the summarising model so the output is deterministic:

```java
import java.util.ArrayList;
import java.util.List;

import com.example.studyai.lab.ScriptedChatModel;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.ChatMemoryRepository;
import org.springframework.ai.chat.memory.InMemoryChatMemoryRepository;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.MessageType;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;

public class LongConversationDemo {

    static String describe(List<Message> messages) {
        return messages.stream().map(m -> m.getMessageType() + ":" + m.getText()).toList().toString();
    }

    /** Replaces everything except the newest keepRecent messages with one summary message. */
    static void compact(ChatMemoryRepository repository, String conversationId, ChatClient summarizer, int keepRecent) {
        List<Message> all = repository.findByConversationId(conversationId);
        if (all.size() <= keepRecent) {
            return;
        }
        int cut = all.size() - keepRecent;
        while (cut < all.size() && all.get(cut).getMessageType() != MessageType.USER) {
            cut++;                                   // keep whole turns: start the recent part at a user message
        }
        List<Message> older = all.subList(0, cut);
        String transcript = String.join("\n", older.stream().map(m -> m.getMessageType() + ": " + m.getText()).toList());
        String summary = summarizer.prompt()
                .system("Summarise this conversation in at most 40 words. Keep names, decisions and open questions.")
                .user(transcript)
                .call().content();
        List<Message> compacted = new ArrayList<>();
        compacted.add(new SystemMessage("Summary of the earlier conversation: " + summary));
        compacted.addAll(all.subList(cut, all.size()));
        repository.saveAll(conversationId, compacted);
    }

    public static void main(String[] args) {
        // 1. A sliding window keeps the system message and the newest whole turns
        ChatMemory window = MessageWindowChatMemory.builder().maxMessages(5).build();
        window.add("w", new SystemMessage("You are a Java tutor."));
        for (int turn = 1; turn <= 4; turn++) {
            window.add("w", List.of(new UserMessage("Q" + turn), new AssistantMessage("A" + turn)));
        }
        System.out.println("Window(5): " + describe(window.get("w")));

        // 2. Summarising older turns keeps their facts in far fewer messages
        var repository = new InMemoryChatMemoryRepository();
        repository.saveAll("s", List.of(
                new UserMessage("I'm Asha, preparing for a Java interview in May."),
                new AssistantMessage("Great, let's plan."),
                new UserMessage("Focus on collections, I'm weak there."),
                new AssistantMessage("We'll start with HashMap."),
                new UserMessage("Explain HashMap resizing."),
                new AssistantMessage("It doubles the table when size exceeds capacity times load factor.")));
        ScriptedChatModel model = new ScriptedChatModel()
                .reply("Asha prepares for a Java interview in May; weak in collections; plan starts with HashMap.");
        compact(repository, "s", ChatClient.create(model), 2);
        System.out.println("Summarizer input lines: " + model.lastPrompt().getUserMessage().getText().lines().count());
        repository.findByConversationId("s").forEach(m -> System.out.println("  " + m.getMessageType() + ": " + m.getText()));
    }
}
```

**Output:**

```text
Window(5): [SYSTEM:You are a Java tutor., USER:Q3, ASSISTANT:A3, USER:Q4, ASSISTANT:A4]
Summarizer input lines: 4
  SYSTEM: Summary of the earlier conversation: Asha prepares for a Java interview in May; weak in collections; plan starts with HashMap.
  USER: Explain HashMap resizing.
  ASSISTANT: It doubles the table when size exceeds capacity times load factor.
```

### Code walkthrough

- The window of 5 kept the system message plus the two newest turns; turns 1 and 2 are gone, including anything the user said there.
- `compact(...)` sends the four older messages to a summarising call and stores one summary message in their place, then the two newest messages. The model still "knows" Asha's name, deadline and weak area.
- The cut is moved forward to a `UserMessage`, the same whole-turn rule the window uses, so a tool call is never separated from its answer.
- Run compaction outside the user's request path when you can (for example after the response is sent, when the conversation crosses a size threshold), because it is an extra model call.

> [!CAUTION]
> The summary is model output. It can drop or distort facts, and text the user typed earlier ends up inside a system-level message. Keep summaries short, label them as summaries, and never let a summary grant permissions. Some providers treat several system messages differently; test how yours handles a summary alongside the main system prompt.

## Common Mistakes and Troubleshooting

- **Context-length errors from the provider after many turns.** Memory is unbounded (a custom `ChatMemory`, or a very large window plus big documents). Bound the window and measure the tokens per request.
- **The assistant "forgets" the user's name.** It was in an evicted turn. Keep durable facts in your own data (a user profile) and add them to the system prompt, or use a summary.
- **Window too small for tool turns.** With `maxMessages` smaller than one tool exchange, all non-system messages can be evicted.
- **Summarising on every request.** Doubles cost and latency; compact only when a threshold is crossed.

## Production Considerations

- Pick the window from real token measurements, not a round number; add the system prompt, retrieved documents and tool definitions to the budget.
- Store important facts in structured data (profile, preferences, tickets) rather than relying on chat history to carry them.
- Offer "start a new conversation" in the UI; it is the cheapest context reset.
- Log the input-token count per call to spot conversations that grow unexpectedly ([Token Usage and Cost Control](../../spring-ai-production/token-usage-and-cost-control/content.md)).

## Common Interview Traps

- **"A bigger context window removes the problem."** It moves the limit; cost and latency still grow with every turn, and long contexts can dilute attention to instructions.
- **"`maxMessages` is exactly how many messages are kept."** It is an upper bound; whole-turn eviction can keep fewer, and system messages count.
- **"A summary is lossless."** It is a lossy model output.

## Key Takeaways

- Every remembered message is resent and paid for on every call.
- `MessageWindowChatMemory` keeps system messages and the newest whole turns (20 messages by default).
- Summaries, retrieval over past messages and structured user data keep important facts without resending everything.
- Decide the policy explicitly and measure tokens.

## Official References

- [Chat Memory: Message Window Chat Memory](https://docs.spring.io/spring-ai/reference/api/chat-memory.html)
- [ChatClient: response metadata and usage](https://docs.spring.io/spring-ai/reference/api/chatclient.html)
- Related: [Chat Memory](../spring-ai-chat-memory/content.md) · [Chat Memory Storage](../chat-memory-storage/content.md) · [Prompt Instruction Design](../prompt-instruction-design/content.md)
