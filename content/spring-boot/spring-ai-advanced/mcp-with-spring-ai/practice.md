# MCP with Spring AI: Servers and Clients — Practice

### P1. Transport

**Difficulty:** Easy · **Type:** MCQ

Which MCP HTTP transport is the intended one in Spring AI 2.0?

- A) SSE
- B) Streamable HTTP
- C) WebSocket
- D) gRPC

<details>
<summary>Answer</summary>

**Answer:** B) Streamable HTTP

</details>

### P2. Client configuration

**Difficulty:** Easy · **Type:** Coding

Configure a client connection named `catalog` to an MCP server at `https://catalog.internal.example`.

<details>
<summary>Answer</summary>

```properties
spring.ai.mcp.client.streamable-http.connections.catalog.url=https://catalog.internal.example
```

</details>

### P3. 404 on /mcp

**Difficulty:** Medium · **Type:** Debugging

A client fails at start-up with `Server Not Found. Status code:404 … "path":"/mcp"`. The server application has the MCP WebMVC starter and an `@McpTool`, and no protocol property. What is wrong?

<details>
<summary>Answer</summary>

With the protocol property unset, the 2.0.1 server activated the deprecated SSE transport, which does not serve `/mcp`. Set `spring.ai.mcp.server.protocol=STREAMABLE` on the server.

</details>

### P4. Write an MCP tool

**Difficulty:** Medium · **Type:** Coding

Expose `int remainingSeats(String courseId)` as an MCP tool with useful descriptions.

<details>
<summary>Answer</summary>

```java
// Illustrative fragment
@Component
class EnrolmentTools {

    @McpTool(name = "remainingSeats", description = "Number of free seats in a course; use before suggesting enrolment")
    int remainingSeats(@McpToolParam(description = "Course id such as java-101") String courseId) {
        return enrolmentService.remainingSeats(courseId);
    }
}
```

</details>

### P5. Trust decision

**Difficulty:** Hard · **Type:** Scenario

A developer wants to connect the production support assistant to a popular open-source MCP server that can read and write files and run shell commands, "because it's convenient". What do you recommend?

<details>
<summary>Answer</summary>

Not in production as is. The server's tools give the model file-system and shell access (excessive agency), and its descriptions and outputs reach the model (injection channel). If a capability is really needed, build or select a narrow server exposing only that operation, review and pin it, run it isolated with least privilege, authenticate it, filter its tools per feature, require approval for writes, and log every call.

</details>
