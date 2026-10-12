# MCP with Spring AI: Servers and Clients

**Module:** Spring AI: Advanced · **Interview priority:** Frequently asked · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21 · MCP Java SDK 2.0.0

## Learning Objectives

- Explain what the Model Context Protocol (MCP) is and when to use it instead of in-process tools.
- Expose tools from a Spring Boot application as an MCP server with `@McpTool`.
- Consume remote MCP tools in a `ChatClient` through the MCP client starter.
- Secure, configure and operate MCP connections in Spring AI 2.0.

## Definition

The **Model Context Protocol (MCP)** is an open protocol for connecting AI applications to external capabilities. An **MCP server** exposes *tools* (functions), *resources* (readable data) and *prompts* (templates); an **MCP client** inside an AI application discovers them and makes them available to the model. Transport is either **stdio** (a local process) or HTTP — in Spring AI 2.0 the **streamable HTTP** transport; the older SSE transport is deprecated.

| Side | Starter | Main pieces |
|------|---------|-------------|
| Server (Spring MVC) | `spring-ai-starter-mcp-server-webmvc` | `@McpTool`, `@McpToolParam`, `@McpResource`, `@McpPrompt`; endpoint `/mcp` |
| Client | `spring-ai-starter-mcp-client` | `spring.ai.mcp.client.*` connections; a `ToolCallbackProvider` bean with the remote tools |

## Why It Matters

In-process `@Tool` methods only serve one application. MCP lets one team publish capabilities once — a course catalogue, a ticketing system, a code-search service — and lets many AI applications (your Spring services, IDE assistants, desktop clients) use them with a standard protocol. It also moves those tools behind a network boundary, which brings the usual concerns: authentication, versioning, latency and trust.

## How It Works

```text
AI application (MCP client)                         MCP server (Spring Boot)
ChatClient ─▶ ToolCallingAdvisor                    @McpTool searchCourses(topic)
   tools: ToolCallbackProvider ── initialize ──────▶ capabilities
                               ── tools/list ──────▶ [searchCourses + JSON schema]
model asks for searchCourses
   SyncMcpToolCallback      ──── tools/call ──────▶ runs the method, returns content
```

At start-up the client connects to each configured server, lists its tools and wraps each as a `ToolCallback`. From then on MCP tools behave like local tools: offer them with `.tools(provider)`, and the tool loop executes them by calling the server.

Configuration checked against 2.0.1:

| Property | Default | Note |
|----------|---------|------|
| `spring.ai.mcp.server.protocol` | metadata says `streamable` | Set it **explicitly** to `STREAMABLE`: in a 2.0.1 check with the property unset, the deprecated SSE transport was activated and `/mcp` returned 404 |
| `spring.ai.mcp.server.streamable-http.mcp-endpoint` | `/mcp` | |
| `spring.ai.mcp.server.name` / `version` | `mcp-server` / `1.0.0` | Shown to clients |
| `spring.ai.mcp.server.type` | `sync` | `async` for reactive servers |
| `spring.ai.mcp.client.streamable-http.connections.<name>.url` | — | One entry per server |
| `spring.ai.mcp.client.request-timeout` | `20s` | |
| `spring.ai.mcp.client.toolcallback.enabled` | `true` | Registers the `ToolCallbackProvider` |
| `spring.ai.mcp.client.sse.connections`, `spring.ai.mcp.server.sse-endpoint` | — | Deprecated in 2.0 |

## Example

A server application exposes a catalogue tool behind HTTP Basic; a client application in the same JVM connects over streamable HTTP, discovers the tool and offers it to a model. The course lab has every Spring AI starter on its classpath, so unrelated auto-configuration is switched off in `COMMON`; a real server or client project only includes its own starter.

```java
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Base64;
import java.util.Map;

import com.example.studyai.lab.ScriptedChatModel;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.ToolResponseMessage;
import org.springframework.ai.mcp.annotation.McpTool;
import org.springframework.ai.mcp.annotation.McpToolParam;
import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.server.context.WebServerApplicationContext;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import io.modelcontextprotocol.client.transport.customizer.McpSyncHttpClientRequestCustomizer;

public class McpDemo {

    // ---- MCP server: exposes a course-catalogue tool over streamable HTTP --------------

    static class CatalogTools {
        @McpTool(name = "searchCourses", description = "Search the StudyHub course catalogue by topic")
        String searchCourses(@McpToolParam(description = "Topic, for example 'collections'") String topic) {
            return topic.toLowerCase().contains("collection") ? "java-collections, java-101" : "no courses found";
        }
    }

    @Configuration
    @EnableAutoConfiguration
    static class ServerApp {
        @Bean
        CatalogTools catalogTools() {
            return new CatalogTools();
        }

        /** The MCP endpoint is an API: authenticate every call; no CSRF for this stateless endpoint. */
        @Bean
        SecurityFilterChain mcpSecurity(HttpSecurity http) throws Exception {
            return http.authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
                    .httpBasic(Customizer.withDefaults())
                    .csrf(csrf -> csrf.ignoringRequestMatchers("/mcp"))
                    .build();
        }
    }

    // ---- MCP client: discovers the server's tools and offers them to the model ---------

    @Configuration
    @EnableAutoConfiguration
    static class ClientApp {
        /** Adds credentials to every MCP request (in production: an OAuth2 token from a secret store). */
        @Bean
        McpSyncHttpClientRequestCustomizer mcpAuth() {
            String basic = Base64.getEncoder().encodeToString("mcp-client:lab-only-secret".getBytes(StandardCharsets.UTF_8));
            return (request, method, uri, body, context) -> request.header("Authorization", "Basic " + basic);
        }
    }

    static final Map<String, Object> COMMON = Map.ofEntries(
            Map.entry("spring.ai.model.chat", "none"),
            Map.entry("spring.ai.model.embedding", "none"),
            Map.entry("spring.ai.model.image", "none"),
            Map.entry("spring.ai.model.audio.speech", "none"),
            Map.entry("spring.ai.model.audio.transcription", "none"),
            Map.entry("spring.ai.model.moderation", "none"),
            Map.entry("spring.main.banner-mode", "off"),
            Map.entry("spring.docker.compose.enabled", "false"),
            Map.entry("logging.level.root", "error"),
            Map.entry("spring.autoconfigure.exclude", "org.springframework.ai.vectorstore.redis.autoconfigure.RedisVectorStoreAutoConfiguration,"
                    + "org.springframework.ai.vectorstore.pgvector.autoconfigure.PgVectorStoreAutoConfiguration"));

    public static void main(String[] args) {
        ConfigurableApplicationContext server = new SpringApplicationBuilder(ServerApp.class)
                .properties(COMMON)
                .properties("server.port=0", "spring.ai.mcp.client.enabled=false",
                        "spring.ai.mcp.server.name=studyhub-catalog", "spring.ai.mcp.server.protocol=STREAMABLE",
                        "spring.security.user.name=mcp-client", "spring.security.user.password=lab-only-secret")
                .run();
        int port = ((WebServerApplicationContext) server).getWebServer().getPort();

        ConfigurableApplicationContext client = new SpringApplicationBuilder(ClientApp.class)
                .web(WebApplicationType.NONE)
                .properties(COMMON)
                .properties("spring.ai.mcp.server.enabled=false",
                        "spring.ai.mcp.client.streamable-http.connections.catalog.url=http://localhost:" + port)
                .run();

        ToolCallbackProvider mcpTools = client.getBean(ToolCallbackProvider.class);
        var names = Arrays.stream(mcpTools.getToolCallbacks()).map(t -> t.getToolDefinition().name()).toList();
        System.out.println("Tools discovered over MCP: " + names);

        ScriptedChatModel model = new ScriptedChatModel()
                .replyWithToolCall(names.get(0), "{\"topic\":\"collections\"}")
                .reply("Try java-collections first, then java-101.");
        String answer = ChatClient.create(model).prompt().user("Which courses cover collections?")
                .tools(mcpTools).call().content();
        var toolMessage = (ToolResponseMessage) model.prompts().get(1).getInstructions().get(2);
        System.out.println("Tool result from the MCP server: " + toolMessage.getResponses().get(0).responseData());
        System.out.println("Answer: " + answer);

        client.close();
        server.close();
    }
}
```

**Output:**

```text
Tools discovered over MCP: [searchCourses]
Tool result from the MCP server: [{"text":"java-collections, java-101"}]
Answer: Try java-collections first, then java-101.
```

The model is the scripted test double; the MCP part is real — two Spring Boot contexts, an HTTP connection, `initialize`, `tools/list` and `tools/call` over the streamable HTTP transport.

### Code walkthrough

- `@McpTool` on a bean method is enough: the server's annotation scanner registers it with its JSON schema (from `@McpToolParam`).
- The client found `searchCourses` at start-up and exposed it through a `ToolCallbackProvider` bean; `.tools(mcpTools)` offered it to the model like a local tool.
- The tool result arrived as MCP content (`[{"text": …}]`) — servers return typed content blocks (text, images, resources), not plain strings.
- **Security first:** with Spring Security on the classpath the `/mcp` endpoint was protected immediately — the first attempt failed with `McpHttpClientTransportAuthorizationException`. The server requires authentication; the client adds credentials with an `McpSyncHttpClientRequestCustomizer` bean. Basic auth with a fixed password is for the lab only; production uses OAuth2 tokens.
- **Protocol gotcha:** without `spring.ai.mcp.server.protocol=STREAMABLE`, the server registered the deprecated SSE endpoints and the client's request to `/mcp` got a 404.

### Using a local stdio server

```properties
# Illustrative: start a local MCP server process and talk to it over stdin/stdout
spring.ai.mcp.client.stdio.servers-configuration=classpath:mcp-servers.json
```

Stdio servers run as child processes of your application — convenient for developer tools, but every server you start runs with your application's permissions.

## Common Mistakes and Troubleshooting

- **`Server Not Found. Status code:404` for `/mcp`.** The server is using the SSE transport; set `spring.ai.mcp.server.protocol=STREAMABLE` (or point the client at the SSE endpoint, which is deprecated).
- **`McpHttpClientTransportAuthorizationException`.** The server requires authentication; configure credentials on the client.
- **Application fails to start because a server is down.** The client initialises connections at start-up; an unavailable server fails `mcpSyncClients`. Decide whether that should block start-up, and monitor server health.
- **Exposing every tool of every server to the model.** Filter tools (`McpToolFilter`) and attach only what each feature needs ([Registering Tools](../../spring-ai-tools-and-advisors/tool-registration-and-descriptions/content.md)).
- **Duplicate tool names across servers.** Use name prefixes (`McpToolNamePrefixGenerator`) so tools stay unique.

## Production Considerations

- Treat MCP servers as dependencies with access to data: review, pin versions, authenticate both ways, and run third-party servers with least privilege (OWASP LLM03, LLM06).
- Tool descriptions from a remote server go straight to your model — a malicious server can inject instructions through them. Only connect to servers you trust.
- Pass the end user's identity explicitly (for example in a token or MCP metadata) so the server can authorise per user, not only per client.
- Remote tools add network latency and failure modes to every tool round; set timeouts and observe `spring.ai.tool` spans.
- Version tool schemas; renaming parameters breaks clients and models' learned usage.

## Common Interview Traps

- **"MCP replaces tool calling."** MCP is a way to *distribute* tools; the model still uses ordinary tool calling, and Spring AI turns MCP tools into `ToolCallback`s.
- **"MCP servers are safe because they are just tools."** They run code, see data and supply text to your model; they are a supply-chain and injection risk.
- **"SSE is the default HTTP transport."** In Spring AI 2.0 streamable HTTP is the intended transport and SSE is deprecated — but set the protocol explicitly.

## Key Takeaways

- MCP standardises tools, resources and prompts between AI applications and capability servers.
- Server: `spring-ai-starter-mcp-server-webmvc` + `@McpTool`; set `spring.ai.mcp.server.protocol=STREAMABLE`; endpoint `/mcp`.
- Client: `spring-ai-starter-mcp-client` + `spring.ai.mcp.client.streamable-http.connections.<name>.url`; use the `ToolCallbackProvider` with `.tools(...)`.
- Authenticate, filter tools, trust only known servers, and observe latency.

## Official References

- [Model Context Protocol in Spring AI](https://docs.spring.io/spring-ai/reference/api/mcp/mcp-overview.html)
- [MCP Server Boot Starter](https://docs.spring.io/spring-ai/reference/api/mcp/mcp-server-boot-starter-docs.html)
- [MCP Client Boot Starter](https://docs.spring.io/spring-ai/reference/api/mcp/mcp-client-boot-starter-docs.html)
- [Model Context Protocol specification](https://modelcontextprotocol.io/)
- Related: [Tool Calling Fundamentals](../../spring-ai-tools-and-advisors/tool-calling-fundamentals/content.md) · [AI Application Security](../../spring-ai-production/ai-application-security/content.md) · [Agentic Workflows](../agentic-workflows/content.md)
