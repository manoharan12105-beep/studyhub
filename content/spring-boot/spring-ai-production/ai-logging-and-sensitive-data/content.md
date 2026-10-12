# Logging AI Calls Without Leaking Sensitive Data

**Module:** Spring AI: Production · **Interview priority:** Frequently asked · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Decide what to log for AI calls: metadata always, content rarely and redacted.
- Know which Spring AI features can log prompts and completions, and their defaults.
- Write an audit advisor that logs metadata, pseudonymises users and redacts content.
- Handle personal data across logs, traces, memory, vector stores and the provider.

## Definition

AI calls carry user text, retrieved documents and model answers — often containing personal data, secrets or confidential business information. **Safe AI logging** records enough to debug, audit and measure (feature, model, tokens, latency, finish reason, retrieved ids, errors) while keeping **content** out of logs by default and redacting it when it must be logged.

Spring AI settings that can expose content (all **off** by default in 2.0.1):

| Property | Logs |
|----------|------|
| `spring.ai.chat.client.observations.log-prompt` / `log-completion` | Prompt / completion of `ChatClient` calls |
| `spring.ai.chat.observations.log-prompt` / `log-completion` | Prompt / completion at the `ChatModel` level |
| `spring.ai.chat.observations.include-error-logging` | Error details in observations |
| `spring.ai.tools.observations.include-content` | Tool arguments and results |
| `spring.ai.vectorstore.observations.log-query-response` | Vector search results |
| `SimpleLoggerAdvisor` (registered by you) | Full request and response at `DEBUG` |

## Why It Matters

Logs are copied to log platforms, retained for months, searchable by many engineers and sometimes shared with vendors — a prompt logged once is a data leak that is hard to undo. Regulations (for example GDPR) require purpose limitation, minimisation and deletion. At the same time, teams need evidence to debug bad answers and to audit who triggered which action.

## How It Works

| Data | Default policy |
|------|----------------|
| Feature, model, token usage, finish reason, latency, error type | Log / metric always |
| User and tenant | Pseudonymised id (hash), not names or emails |
| Conversation id | Log (it is already a server-generated identifier) |
| Retrieved document ids and tool names | Log (ids, not content) |
| Prompt and answer text | Off; redacted samples only where needed, short retention, restricted access |
| Tool arguments | Off, or redacted; never secrets |
| Secrets (API keys, tokens) | Never — also scrub from prompts before they reach the model |

Where personal data lives in an AI system — each needs its own retention and deletion story:

```text
user input ─▶ logs/traces ─▶ chat memory store ─▶ vector store (if ingested) ─▶ model provider (retention per contract)
```

## Example

An audit advisor logs metadata on every call and redacted content only when explicitly enabled:

```java
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.regex.Pattern;

import com.example.studyai.lab.ScriptedChatModel;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.ChatClientRequest;
import org.springframework.ai.chat.client.ChatClientResponse;
import org.springframework.ai.chat.client.advisor.api.AdvisorChain;
import org.springframework.ai.chat.client.advisor.api.BaseAdvisor;
import org.springframework.core.Ordered;

public class SafeLoggingDemo {

    /** Masks common secrets and personal data before anything is logged. */
    static final class Redactor {
        private static final Pattern EMAIL = Pattern.compile("[\\w.+-]+@[\\w-]+(?:\\.[\\w-]+)+");
        private static final Pattern CARD = Pattern.compile("\\b\\d(?:[ -]?\\d){12,18}\\b");
        private static final Pattern API_KEY = Pattern.compile("\\bsk-[A-Za-z0-9_-]{8,}");

        static String redact(String text) {
            String result = API_KEY.matcher(text).replaceAll("[api-key]");
            result = CARD.matcher(result).replaceAll("[card]");
            return EMAIL.matcher(result).replaceAll("[email]");
        }
    }

    static String pseudonym(String userId) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(userId.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash, 0, 6);
        }
        catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    /** Logs metadata always, content only redacted and only when explicitly enabled. */
    static final class AuditLogAdvisor implements BaseAdvisor {
        private final boolean logContent;

        AuditLogAdvisor(boolean logContent) {
            this.logContent = logContent;
        }

        @Override
        public ChatClientRequest before(ChatClientRequest request, AdvisorChain chain) {
            if (logContent) {
                System.out.println("ai.request  text=\"" + Redactor.redact(request.prompt().getUserMessage().getText()) + "\"");
            }
            return request;
        }

        @Override
        public ChatClientResponse after(ChatClientResponse response, AdvisorChain chain) {
            var metadata = response.chatResponse().getMetadata();
            System.out.println("ai.audit    feature=" + response.context().get("feature")
                    + " user=" + pseudonym((String) response.context().get("userId"))
                    + " model=" + metadata.getModel()
                    + " tokens=" + metadata.getUsage().getTotalTokens());
            if (logContent) {
                System.out.println("ai.response text=\"" + Redactor.redact(response.chatResponse().getResult().getOutput().getText()) + "\"");
            }
            return response;
        }

        @Override
        public int getOrder() {
            return Ordered.HIGHEST_PRECEDENCE + 150;
        }
    }

    public static void main(String[] args) {
        String question = "My card 4111 1111 1111 1111 was charged twice; email me at priya.n@example.com. "
                + "Our key is sk-test_abc123XYZ789.";
        System.out.println("raw:        " + question);

        for (boolean logContent : new boolean[] {false, true}) {
            System.out.println("--- logContent=" + logContent);
            ScriptedChatModel model = new ScriptedChatModel()
                    .reply("Sorry about that. We'll refund the duplicate charge and reply to priya.n@example.com.");
            ChatClient client = ChatClient.builder(model).defaultAdvisors(new AuditLogAdvisor(logContent)).build();
            client.prompt().user(question)
                    .advisors(a -> a.param("feature", "billing-help").param("userId", "customer-1842"))
                    .call().content();
        }
    }
}
```

**Output:**

```text
raw:        My card 4111 1111 1111 1111 was charged twice; email me at priya.n@example.com. Our key is sk-test_abc123XYZ789.
--- logContent=false
ai.audit    feature=billing-help user=43be978cbee5 model=scripted-model tokens=57
--- logContent=true
ai.request  text="My card [card] was charged twice; email me at [email]. Our key is [api-key]."
ai.audit    feature=billing-help user=43be978cbee5 model=scripted-model tokens=57
ai.response text="Sorry about that. We'll refund the duplicate charge and reply to [email]."
```

The card number and key are well-known test values; `System.out` stands in for a structured logger.

### Code walkthrough

- With `logContent=false` (the default you want in production) only metadata was logged: feature, a pseudonymous user id, model and tokens.
- The user id `customer-1842` became `43be978cbee5` — the same user always maps to the same pseudonym, so you can correlate requests without storing the identifier. A plain hash of a small id space can be reversed by brute force; use a keyed hash (HMAC) with a secret in production.
- With content logging enabled, the card number, email and API key were masked in both the question and the answer. The first version of these patterns swallowed the space after the card number and the full stop after the email — a reminder that regex redaction is brittle and must be tested.
- The advisor runs at `HIGHEST_PRECEDENCE + 150`: outside the tool loop, once per request.

### Using SimpleLoggerAdvisor safely

```java
// Illustrative fragment — SimpleLoggerAdvisor logs at DEBUG with custom formatting
SimpleLoggerAdvisor logger = SimpleLoggerAdvisor.builder()
        .requestToString(request -> Redactor.redact(request.prompt().getContents()))
        .responseToString(response -> "finish=" + response.getResult().getMetadata().getFinishReason()
                + " tokens=" + response.getMetadata().getUsage().getTotalTokens())
        .build();
```

```properties
# Enable only where needed (for example a dev profile)
logging.level.org.springframework.ai.chat.client.advisor=DEBUG
```

## Common Mistakes and Troubleshooting

- **`log-prompt=true` in production "to debug one issue"** — then forgotten. Enable per environment with an expiry, or sample.
- **Logging the exception message from the provider SDK verbatim.** Some error messages echo request content; log status and type.
- **Redacting logs but not traces.** Observation attributes and tracing backends need the same policy.
- **Secrets inside prompts.** If a key or password reaches the prompt, it reaches the provider and possibly memory; scrub inputs and never put credentials in system prompts or tool results.
- **Forgetting memory and vector stores** when handling deletion requests.

## Production Considerations

- Structured logs (JSON) with stable keys: `feature`, `model`, `tokens.input`, `tokens.output`, `finish_reason`, `latency_ms`, `conversation_id`, `user_hash`.
- Separate audit logs (who triggered which tool action) from debug logs; audit logs need integrity and longer retention, debug logs short retention.
- Review provider data-retention and training settings in the contract; choose regions and zero-retention options where required.
- Consider a redaction/PII-detection step before the model call for features that receive free text from customers ([AI Application Security](../ai-application-security/content.md)).

## Common Interview Traps

- **"We need full prompts in logs to debug."** Metadata, retrieved ids and redacted samples are usually enough; full content needs a justified, time-limited exception.
- **"Hashing makes data anonymous."** Hashes of guessable values can be reversed; that is pseudonymisation, not anonymisation.
- **"Spring AI logs prompts by default."** The observation content options default to `false`.

## Key Takeaways

- Log metadata always; content off by default, redacted and time-limited when on.
- Spring AI's prompt/completion/tool-content observation options are off by default — keep them that way in production.
- Pseudonymise users with a keyed hash; never log secrets.
- Personal data lives in logs, traces, memory, vector stores and at the provider — plan retention and deletion for each.

## Official References

- [Observability](https://docs.spring.io/spring-ai/reference/observability/index.html)
- [Advisors: SimpleLoggerAdvisor](https://docs.spring.io/spring-ai/reference/api/advisors.html)
- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
- Related: [Logging in Spring Boot](../../production/spring-logging/content.md) · [Observability](../spring-ai-observability/content.md) · [Conversation IDs and Isolation](../../spring-ai-prompts-and-memory/conversation-ids-and-isolation/content.md)
