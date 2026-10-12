# System, User, Assistant and Tool Messages

**Module:** Spring AI: ChatClient · **Interview priority:** Core · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Explain the purpose of each message role: `SYSTEM`, `USER`, `ASSISTANT` and `TOOL`.
- Decide what belongs in the system message versus the user message.
- Build message lists with Spring AI's message classes and read them back.
- Recognise how history, few-shot examples and tool results appear as messages.

## Definition

Chat models receive a **list of messages**, each tagged with a **role**. In Spring AI every message implements `Message` and reports its role with `getMessageType()`:

| Role | Class | Written by | Purpose |
|------|-------|-----------|---------|
| `SYSTEM` | `SystemMessage` | Your application | Instructions, persona, rules, output format — the "job description" |
| `USER` | `UserMessage` | The end user (via your app) | The question or task, plus data and media |
| `ASSISTANT` | `AssistantMessage` | The model | Earlier answers; also tool-call requests |
| `TOOL` | `ToolResponseMessage` | Your application | Results of tool calls the model requested |

## Why It Matters

Roles are how a model tells instructions from data and its own previous answers from the user's words. Putting text in the wrong role causes weaker instruction-following, confusing histories and easier prompt injection. Every later feature is built from messages: memory adds `USER`/`ASSISTANT` pairs, RAG augments the `USER` message, and the tool loop adds `ASSISTANT` tool calls and `TOOL` results.

## How It Works

A typical request after a few turns, with a tool call in progress:

```text
SYSTEM     You are the StudyHub assistant. Answer only Java questions. Be concise.
USER       What is a record?                         ← earlier turn (from memory)
ASSISTANT  A record is an immutable data carrier.     ← earlier turn (from memory)
USER       What grade did I get in the Java quiz?     ← current question
ASSISTANT  [tool call: getGrade(studentId="s42")]     ← model asks your app to run a tool
TOOL       {"quiz":"java-basics","grade":"A"}         ← your app's tool result
                                       ↓
model generates: "You got an A in the Java basics quiz."
```

- The **system** message comes first and carries the most weight. Models are trained to follow it over conflicting user text, though not perfectly.
- **User** and **assistant** messages alternate to form the conversation. The model is stateless; earlier turns exist only because your application resends them ([Chat Memory](../../spring-ai-prompts-and-memory/spring-ai-chat-memory/content.md)).
- **Assistant** messages may contain `toolCalls` instead of text; **tool** messages answer them by id ([The Tool-Calling Loop](../../spring-ai-tools-and-advisors/tool-calling-loop/content.md)).

## What Goes Where

| Put in the system message | Put in the user message |
|---------------------------|-------------------------|
| Role and scope ("You answer Java interview questions") | The user's question |
| Rules and refusals ("If unsure, say you do not know") | Data the user supplied (text to summarise, a code snippet) |
| Output format and length | Retrieved documents (RAG advisors add them here) |
| Trusted, application-controlled facts | Anything untrusted |

Keep untrusted content out of the system message. If user text is concatenated into the system message, the user can write instructions with system-level weight ([Prompt Injection](../../spring-ai-prompts-and-memory/prompt-injection-and-untrusted-input/content.md)).

## Messages in Spring AI

With `ChatClient` you usually do not create message objects: `system(...)` creates a `SystemMessage`, `user(...)` a `UserMessage`, memory advisors add history, and the tool loop adds assistant and tool messages. Create them yourself when you pass history explicitly with `messages(...)`, write few-shot examples ([Few-Shot Prompting](../../spring-ai-prompts-and-memory/few-shot-prompting/content.md)), or call `ChatModel` directly.

Messages can carry **metadata** (`user(u -> u.text(..).metadata("userId", id))`) that advisors and logging can read. Metadata is not sent to the model as text.

## Example

Build the conversation above by hand, send it, and inspect the roles.

```java
import java.util.List;
import java.util.Map;

import com.example.studyai.lab.ScriptedChatModel;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.ToolResponseMessage;
import org.springframework.ai.chat.messages.UserMessage;

public class RolesDemo {

    public static void main(String[] args) {
        ScriptedChatModel model = new ScriptedChatModel().reply("You got an A in the Java basics quiz.");
        ChatClient client = ChatClient.builder(model)
                .defaultSystem("You are the StudyHub assistant. Answer only Java questions. Be concise.")
                .build();

        var toolCall = new AssistantMessage.ToolCall("call-1", "function", "getGrade", "{\"studentId\":\"s42\"}");
        List<Message> history = List.of(
                new UserMessage("What is a record?"),
                new AssistantMessage("A record is an immutable data carrier."),
                new UserMessage("What grade did I get in the Java quiz?"),
                AssistantMessage.builder().content("").toolCalls(List.of(toolCall)).build(),
                ToolResponseMessage.builder()
                        .responses(List.of(new ToolResponseMessage.ToolResponse(
                                "call-1", "getGrade", "{\"quiz\":\"java-basics\",\"grade\":\"A\"}")))
                        .build());

        String answer = client.prompt()
                .messages(history)
                .call()
                .content();

        for (Message m : model.lastPrompt().getInstructions()) {
            String text = m instanceof ToolResponseMessage t ? t.getResponses().get(0).responseData()
                    : m instanceof AssistantMessage a && a.hasToolCalls() ? "[tool call " + a.getToolCalls().get(0).name() + "]"
                    : m.getText();
            System.out.printf("%-9s %s%n", m.getMessageType(), text);
        }
        System.out.println("Answer:   " + answer);
    }
}
```

**Output:**

```text
SYSTEM    You are the StudyHub assistant. Answer only Java questions. Be concise.
USER      What is a record?
ASSISTANT A record is an immutable data carrier.
USER      What grade did I get in the Java quiz?
ASSISTANT [tool call getGrade]
TOOL      {"quiz":"java-basics","grade":"A"}
Answer:   You got an A in the Java basics quiz.
```

### Code walkthrough

- `defaultSystem(...)` produced the `SYSTEM` message; it is placed first even though the history came from `messages(...)`.
- The `AssistantMessage` built with `toolCalls(...)` has empty text; `ToolResponseMessage.ToolResponse` links the result to the call by its id (`call-1`) and tool name.
- `messages(history)` was enough to make the request; no extra `user(...)` was needed because the last relevant messages are already in the list. In normal code the tool loop creates the last two messages for you.

## Common Mistakes and Troubleshooting

- **Instructions in the user message, data in the system message.** Swap them: rules in `SYSTEM`, data in `USER`.
- **Several system messages competing.** Combine instructions into one clear system message; memory implementations keep only the most recent system message.
- **Tool results without matching calls.** A `TOOL` message must answer a tool call id from the preceding assistant message; providers reject orphaned tool results with a 400 error.
- **Huge system messages.** Long rule lists cost tokens on every request and dilute the important rules; keep them short and test them.

## Production Considerations

- Version the system prompt and record which version produced each answer; it is part of your application's behaviour.
- Never put secrets (API keys, internal URLs, other users' data) in any message: the model may repeat them.
- Use message metadata (user id, request id) for logging and auditing instead of putting identifiers into the prompt text.

## Common Interview Traps

- **"The model remembers previous messages."** It sees only what the current request contains.
- **"The system message makes injection impossible."** It raises priority; it does not guarantee obedience.
- **"Assistant messages are always text."** They can be tool-call requests with empty text.

## Key Takeaways

- Four roles: `SYSTEM` (rules), `USER` (task and data), `ASSISTANT` (model output, including tool calls), `TOOL` (tool results).
- Keep trusted instructions in the system message and untrusted content in user messages.
- Memory, RAG and tool calling are all just messages added to the list.

## Official References

- [Prompts and message roles](https://docs.spring.io/spring-ai/reference/api/prompt.html)
- [ChatClient: message metadata](https://docs.spring.io/spring-ai/reference/api/chatclient.html)
