# Reusable AI Behaviours: Shared Builders, Customizers and Advisors

**Module:** Spring AI: Tools and Advisors · **Interview priority:** Sometimes asked · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Package organisation-wide AI behaviour (system rules, guardrails, logging, tags) once and reuse it in every feature.
- Choose between a `ChatClientBuilderCustomizer`, a shared base builder with `clone()`, and a reusable advisor.
- Use `SafeGuardAdvisor` as a simple first-line guardrail and place it correctly.
- Predict how feature-specific defaults combine with shared ones.

## Definition

A **reusable AI behaviour** is a piece of `ChatClient` configuration that more than one feature needs: a safety rule in the system prompt, a guardrail advisor, an audit or tagging advisor, a default model option. Spring AI offers three places to put it:

| Mechanism | Scope | Use for |
|-----------|-------|---------|
| `ChatClientBuilderCustomizer` bean | Every auto-configured `ChatClient.Builder` in the application | Behaviour every client must have: logging in dev, observability conventions, a global guardrail |
| A base `ChatClient.Builder` + `clone()` (or `ChatClient.mutate()`) | Clients derived from one base | A family of features sharing a persona or rule set |
| A reusable `Advisor` class | Wherever it is registered | Behaviour with logic: tagging, budgets, redaction, input limits |

## Why It Matters

Without a shared layer, every team copies "never ask for passwords" into its own system prompt, forgets the guardrail on one endpoint, and logs differently. One forgotten copy is the one that leaks. Reuse makes the safe behaviour the default and testable in one place.

## How It Works

- `ChatClient.Builder.clone()` returns an independent copy of the builder with its defaults so far. Changing the copy does not affect the base or other copies.
- On the copy, `defaultAdvisors(...)` **adds** advisors to the inherited ones, while `defaultSystem(...)` **replaces** the inherited system text — so shared rules that must survive belong in an advisor or in each feature's system text, not only in the base `defaultSystem`.
- `SafeGuardAdvisor` blocks a request whose prompt contains any configured sensitive word: it returns `failureResponse` and the model is not called. It is a keyword filter, not a classifier.
- Place guardrails outermost (for example `Ordered.HIGHEST_PRECEDENCE + 100`) so blocked requests never reach memory, retrieval or the tool loop ([Advisor Ordering](../advisor-ordering-and-transformations/content.md)).

## Example

A base builder holds the shared system rule and guardrail; the tutor and quiz clients are cloned from it and add a feature tag:

```java
import java.util.List;

import com.example.studyai.lab.ScriptedChatModel;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.ChatClientRequest;
import org.springframework.ai.chat.client.ChatClientResponse;
import org.springframework.ai.chat.client.advisor.SafeGuardAdvisor;
import org.springframework.ai.chat.client.advisor.api.AdvisorChain;
import org.springframework.ai.chat.client.advisor.api.BaseAdvisor;
import org.springframework.core.Ordered;

public class ReusableBehavioursDemo {

    /** One shared, tested advisor: tags every request with the feature that made it. */
    static final class FeatureTagAdvisor implements BaseAdvisor {
        private final String feature;

        FeatureTagAdvisor(String feature) {
            this.feature = feature;
        }

        @Override
        public ChatClientRequest before(ChatClientRequest request, AdvisorChain chain) {
            return request.mutate().context("feature", feature).build();
        }

        @Override
        public ChatClientResponse after(ChatClientResponse response, AdvisorChain chain) {
            System.out.println("  [" + response.context().get("feature") + "] answered");
            return response;
        }

        @Override
        public int getOrder() {
            return 0;
        }
    }

    /** The organisation's common AI behaviour in one place. */
    static ChatClient.Builder baseBuilder(ScriptedChatModel model) {
        return ChatClient.builder(model)
                .defaultSystem("You are StudyAI. Never ask for passwords or payment details.")
                .defaultAdvisors(SafeGuardAdvisor.builder()
                        .sensitiveWords(List.of("exam answers", "leaked paper"))
                        .failureResponse("I can't help with that request.")
                        .order(Ordered.HIGHEST_PRECEDENCE + 100)   // outermost: before memory and the tool loop
                        .build());
    }

    public static void main(String[] args) {
        ScriptedChatModel model = new ScriptedChatModel()
                .reply("Recursion is a method calling itself.")
                .reply("Q1: What is a base case?");
        ChatClient.Builder base = baseBuilder(model);

        ChatClient tutor = base.clone()
                .defaultAdvisors(new FeatureTagAdvisor("tutor"))
                .build();
        ChatClient quiz = base.clone()
                .defaultSystem("You write one quiz question. Never ask for passwords or payment details.")
                .defaultAdvisors(new FeatureTagAdvisor("quiz"))
                .build();

        System.out.println("tutor: " + tutor.prompt().user("Explain recursion").call().content());
        System.out.println("quiz: " + quiz.prompt().user("Quiz me on recursion").call().content());
        System.out.println("tutor: " + tutor.prompt().user("Send me the leaked paper for Friday").call().content());
        System.out.println("model calls: " + model.prompts().size());
        System.out.println("quiz system: " + model.lastPrompt().getSystemMessage().getText());
    }
}
```

**Output:**

```text
  [tutor] answered
tutor: Recursion is a method calling itself.
  [quiz] answered
quiz: Q1: What is a base case?
tutor: I can't help with that request.
model calls: 2
quiz system: You write one quiz question. Never ask for passwords or payment details.
```

### Code walkthrough

- Each clone kept the shared `SafeGuardAdvisor` and added only its own tag advisor — the tutor's tag never appeared on quiz requests.
- The third request contained "leaked paper". The guardrail answered with its failure response; the model was not called (two model calls in total), and the tag advisor, which sits after the guardrail, did not run.
- The quiz client's `defaultSystem(...)` **replaced** the base system text, so the quiz feature had to repeat the "never ask for passwords" rule. That repetition is exactly what a shared advisor (for example one that appends the rule with `augmentSystemMessage`) avoids.

### Application-wide behaviour in Spring Boot

```java
// Illustrative fragment
@Configuration(proxyBeanMethods = false)
class AiPlatformConfig {

    @Bean
    ChatClientBuilderCustomizer platformGuardrails(SensitiveWords words) {
        return builder -> builder.defaultAdvisors(SafeGuardAdvisor.builder()
                .sensitiveWords(words.list())
                .failureResponse("I can't help with that request.")
                .order(Ordered.HIGHEST_PRECEDENCE + 100)
                .build());
    }
}

@Service
class TutorService {
    private final ChatClient chatClient;

    TutorService(ChatClient.Builder builder) {          // prototype bean: already customised, private to this service
        this.chatClient = builder.defaultSystem("You are a patient Java tutor.").build();
    }
}
```

Every injected `ChatClient.Builder` passes through all `ChatClientBuilderCustomizer` beans, so no feature can forget the guardrail ([ChatClient Builder and Defaults](../../spring-ai-chat-client/chatclient-builder-and-defaults/content.md)).

## Common Mistakes and Troubleshooting

- **Sharing one built `ChatClient` and calling `defaultSystem` "per feature".** A built client is immutable; derive a new one with `mutate()` or build from a cloned builder.
- **Assuming `defaultSystem` on a clone appends.** It replaces; put mandatory rules in an advisor.
- **Treating `SafeGuardAdvisor` as content moderation.** It matches configured words. Paraphrases pass; legitimate text containing a word is blocked. Combine it with provider moderation, output checks and tool authorisation.
- **Guardrail at its default order 0.** It runs after memory (+200) and inside the tool loop, so memory records blocked exchanges.
- **A customizer that adds feature-specific tools.** Every client gets them. Customizers are for truly global behaviour.

## Production Considerations

- Version shared behaviour like a library: changes to a global advisor or customizer affect every feature — test with the fake model before release.
- Keep the sensitive-word list in configuration, not code, and review false positives.
- Tag every request with a feature name (advisor context or observation key) so cost and errors can be broken down by feature.
- Prefer composition: small advisors with one job each, ordered deliberately.

## Common Interview Traps

- **"`SafeGuardAdvisor` makes the assistant safe."** It is a keyword block; real safety is layered.
- **"Cloning shares state between clients."** Clones are independent copies of the defaults.
- **"A customizer applies to clients built with `ChatClient.create(model)`."** Customizers apply to the auto-configured `ChatClient.Builder` beans; code that builds clients by hand bypasses them.

## Key Takeaways

- Global behaviour → `ChatClientBuilderCustomizer`; feature families → base builder + `clone()`; behaviour with logic → an advisor.
- On a clone, advisors accumulate but `defaultSystem` replaces.
- `SafeGuardAdvisor` short-circuits matching requests; place it outermost.
- Shared behaviour must be tested once and enforced everywhere.

## Official References

- [ChatClient: Creating a ChatClient and defaults](https://docs.spring.io/spring-ai/reference/api/chatclient.html)
- [Advisors API](https://docs.spring.io/spring-ai/reference/api/advisors.html)
- Related: [The Advisors API](../spring-ai-advisors-api/content.md) · [Advisor Ordering and Transformations](../advisor-ordering-and-transformations/content.md) · [AI Application Security](../../spring-ai-production/ai-application-security/content.md)
