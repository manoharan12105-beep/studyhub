# Lab 10: Configure a Local MCP Server

**Lab:** 10 · **Module:** MCP and External Tools · **Difficulty:** Intermediate · **Verification:** Partially tested — the stdio session and the `claude mcp add/get/list/remove` commands ran (Claude Code v2.1.289, JDK 21, isolated configuration directory); asking Claude to call the tool in a session needs your model session and was not run.

> [!NOTE]
> **Local, not live.** The server in this lab is a small Java program on your machine that returns fixed text. It connects to nothing external, needs no account, token or network, and is safe to run. Real MCP servers (GitHub, databases, ticket systems) work the same way but act on real systems — read *MCP Security and Trust* first.

## Objective

Run a JDK-only MCP server over stdio, talk to it by hand to see the protocol, connect Claude Code to it, check its scope and status, use it in a session, and remove it cleanly.

## Prerequisites

- JDK 21 (`java -version`); Claude Code signed in.
- The lessons *What Is MCP?* and *Configuring MCP Servers*.

## Scenario

The team keeps deploy, rollback and migration runbooks in a wiki. You want Claude to look them up on request — through a tool with a clear name and input schema, not by pasting wiki pages into prompts.

## Starting State

A folder outside the repository, for example `~/cc-labs/mcp-runbook/`.

## Instructions

### Step 1: Save the server

`RunbookServer.java`:

```java
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.PrintStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * A teaching MCP server: stdio transport, one tool, JDK only.
 * Each line on stdin is one JSON-RPC message; each response is one line on stdout.
 * stdout carries only protocol messages, so all logging goes to stderr.
 * Real servers should use an MCP SDK instead of this hand-written JSON code.
 */
public class RunbookServer {

    private static final Map<String, String> RUNBOOKS = Map.of(
            "deploy", "1. Merge to main after CI is green. 2. The pipeline builds the image. "
                    + "3. A human approves the production environment. 4. Watch /actuator/health for 10 minutes.",
            "rollback", "1. Redeploy the previous image tag. 2. Do not roll back database migrations; "
                    + "ship a new forward migration instead. 3. Post in #incidents.",
            "db-migration", "1. Add a new V<n>__description.sql file; never edit an applied one. "
                    + "2. Make it backward compatible with the running version. 3. Run ./mvnw verify.");

    public static void main(String[] args) throws Exception {
        PrintStream out = new PrintStream(System.out, true, StandardCharsets.UTF_8);
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in, StandardCharsets.UTF_8));
        System.err.println("runbook server started");
        String line;
        while ((line = in.readLine()) != null) {
            if (line.isBlank()) {
                continue;
            }
            Map<String, Object> request = asMap(new Json(line).value());
            Object id = request.get("id");
            String method = (String) request.get("method");
            if (id == null) {
                System.err.println("notification: " + method);   // notifications get no response
                continue;
            }
            Map<String, Object> response = obj("jsonrpc", "2.0", "id", id);
            switch (method) {
                case "initialize" -> response.put("result", initialize(asMap(request.get("params"))));
                case "tools/list" -> response.put("result", obj("tools", List.of(runbookTool())));
                case "tools/call" -> response.put("result", callTool(asMap(request.get("params"))));
                case "ping" -> response.put("result", obj());
                default -> response.put("error", obj("code", -32601, "message", "Method not found: " + method));
            }
            out.println(Json.write(response));
        }
    }

    private static Map<String, Object> initialize(Map<String, Object> params) {
        // This teaching server accepts the protocol version the client asks for.
        return obj("protocolVersion", params.getOrDefault("protocolVersion", "2025-06-18"),
                "capabilities", obj("tools", obj()),
                "serverInfo", obj("name", "runbook", "version", "1.0.0"));
    }

    private static Map<String, Object> runbookTool() {
        Map<String, Object> topic = obj("type", "string", "enum", List.of("deploy", "rollback", "db-migration"));
        return obj("name", "get_runbook",
                "description", "Returns the team's runbook for deploy, rollback or db-migration.",
                "inputSchema", obj("type", "object", "properties", obj("topic", topic), "required", List.of("topic")));
    }

    private static Map<String, Object> callTool(Map<String, Object> params) {
        Map<String, Object> arguments = asMap(params.get("arguments"));
        String text = RUNBOOKS.get(String.valueOf(arguments.get("topic")));
        boolean error = text == null;
        if (error) {
            text = "Unknown topic. Use deploy, rollback or db-migration.";
        }
        return obj("content", List.of(obj("type", "text", "text", text)), "isError", error);
    }

    /** An ordered JSON object, so every response prints its fields in the same order. */
    private static Map<String, Object> obj(Object... keysAndValues) {
        Map<String, Object> map = new LinkedHashMap<>();
        for (int i = 0; i < keysAndValues.length; i += 2) {
            map.put((String) keysAndValues[i], keysAndValues[i + 1]);
        }
        return map;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> asMap(Object value) {
        return value instanceof Map<?, ?> map ? (Map<String, Object>) map : Map.of();
    }

    /** Minimal JSON reader and writer: objects, arrays, strings, numbers, booleans, null. */
    static final class Json {
        private final String text;
        private int pos;

        Json(String text) {
            this.text = text;
        }

        Object value() {
            skipSpaces();
            char c = text.charAt(pos);
            if (c == '{') return object();
            if (c == '[') return array();
            if (c == '"') return string();
            if (text.startsWith("true", pos)) { pos += 4; return Boolean.TRUE; }
            if (text.startsWith("false", pos)) { pos += 5; return Boolean.FALSE; }
            if (text.startsWith("null", pos)) { pos += 4; return null; }
            int start = pos;
            while (pos < text.length() && "+-0123456789.eE".indexOf(text.charAt(pos)) >= 0) pos++;
            String number = text.substring(start, pos);
            return number.matches("-?\\d+") ? (Object) Long.parseLong(number) : (Object) Double.parseDouble(number);
        }

        private Map<String, Object> object() {
            Map<String, Object> map = new LinkedHashMap<>();
            pos++;
            skipSpaces();
            if (text.charAt(pos) == '}') { pos++; return map; }
            while (true) {
                skipSpaces();
                String key = string();
                skipSpaces();
                pos++;                                   // ':'
                map.put(key, value());
                skipSpaces();
                if (text.charAt(pos++) == '}') return map;   // otherwise ','
            }
        }

        private List<Object> array() {
            List<Object> list = new ArrayList<>();
            pos++;
            skipSpaces();
            if (text.charAt(pos) == ']') { pos++; return list; }
            while (true) {
                list.add(value());
                skipSpaces();
                if (text.charAt(pos++) == ']') return list;  // otherwise ','
            }
        }

        private String string() {
            StringBuilder sb = new StringBuilder();
            pos++;                                       // opening quote
            while (true) {
                char c = text.charAt(pos++);
                if (c == '"') return sb.toString();
                if (c != '\\') { sb.append(c); continue; }
                char e = text.charAt(pos++);
                switch (e) {
                    case 'n' -> sb.append('\n');
                    case 't' -> sb.append('\t');
                    case 'r' -> sb.append('\r');
                    case 'b' -> sb.append('\b');
                    case 'f' -> sb.append('\f');
                    case 'u' -> { sb.append((char) Integer.parseInt(text.substring(pos, pos + 4), 16)); pos += 4; }
                    default -> sb.append(e);             // \" \\ \/
                }
            }
        }

        private void skipSpaces() {
            while (pos < text.length() && Character.isWhitespace(text.charAt(pos))) pos++;
        }

        static String write(Object value) {
            if (value == null) return "null";
            if (value instanceof String s) return quote(s);
            if (value instanceof Number || value instanceof Boolean) return value.toString();
            if (value instanceof Map<?, ?> map) {
                StringBuilder sb = new StringBuilder("{");
                for (Map.Entry<?, ?> entry : map.entrySet()) {
                    if (sb.length() > 1) sb.append(',');
                    sb.append(quote(entry.getKey().toString())).append(':').append(write(entry.getValue()));
                }
                return sb.append('}').toString();
            }
            if (value instanceof List<?> list) {
                StringBuilder sb = new StringBuilder("[");
                for (Object item : list) {
                    if (sb.length() > 1) sb.append(',');
                    sb.append(write(item));
                }
                return sb.append(']').toString();
            }
            throw new IllegalArgumentException("Cannot write " + value.getClass());
        }

        private static String quote(String s) {
            StringBuilder sb = new StringBuilder("\"");
            for (char c : s.toCharArray()) {
                switch (c) {
                    case '"' -> sb.append("\\\"");
                    case '\\' -> sb.append("\\\\");
                    case '\n' -> sb.append("\\n");
                    case '\r' -> sb.append("\\r");
                    case '\t' -> sb.append("\\t");
                    default -> {
                        if (c < 0x20) sb.append(String.format("\\u%04x", (int) c));
                        else sb.append(c);
                    }
                }
            }
            return sb.append('"').toString();
        }
    }
}
```

The rule that matters most for stdio servers: **stdout carries only protocol messages**; logs go to stderr.

### Step 2: Talk to it by hand

Save these requests as `session.jsonl`:

```json
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"manual-test","version":"0.0.1"}}}
{"jsonrpc":"2.0","method":"notifications/initialized"}
{"jsonrpc":"2.0","id":2,"method":"tools/list"}
{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"get_runbook","arguments":{"topic":"rollback"}}}
{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"get_runbook","arguments":{"topic":"payroll"}}}
{"jsonrpc":"2.0","id":5,"method":"resources/list"}
```

Run the server with the file as its input (Java 21 runs a single source file directly):

```bash
java RunbookServer.java < session.jsonl
```

**Output** (stdout; one response per request that has an id):

```text
{"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2025-06-18","capabilities":{"tools":{}},"serverInfo":{"name":"runbook","version":"1.0.0"}}}
{"jsonrpc":"2.0","id":2,"result":{"tools":[{"name":"get_runbook","description":"Returns the team's runbook for deploy, rollback or db-migration.","inputSchema":{"type":"object","properties":{"topic":{"type":"string","enum":["deploy","rollback","db-migration"]}},"required":["topic"]}}]}}
{"jsonrpc":"2.0","id":3,"result":{"content":[{"type":"text","text":"1. Redeploy the previous image tag. 2. Do not roll back database migrations; ship a new forward migration instead. 3. Post in #incidents."}],"isError":false}}
{"jsonrpc":"2.0","id":4,"result":{"content":[{"type":"text","text":"Unknown topic. Use deploy, rollback or db-migration."}],"isError":true}}
{"jsonrpc":"2.0","id":5,"error":{"code":-32601,"message":"Method not found: resources/list"}}
```

stderr showed `runbook server started` and `notification: notifications/initialized`. Read the results: the handshake, the tool list with its JSON Schema, a successful call, a failed call (`isError: true` — a tool-level error Claude can read) and an unsupported method (a JSON-RPC `error`, code -32601).

### Step 3: Register it with Claude Code

User scope keeps it out of the repository while you experiment. Use the absolute path to your file:

```bash
claude mcp add --scope user runbook -- java /absolute/path/to/RunbookServer.java
```

**Output** (Windows run; paths shortened):

```text
Added stdio MCP server runbook with command: java …\mcp-runbook\RunbookServer.java to user config
File modified: …\.claude.json
```

Everything after `--` is the server command; without `--`, Claude Code would try to parse the server's own arguments as its options.

### Step 4: Check status and scope

```bash
claude mcp get runbook
claude mcp list
```

**Output** (paths shortened):

```text
runbook:
  Scope: User config (available in all your projects)
  Status: ✔ Connected
  Type: stdio
  Command: java
  Args: …\mcp-runbook\RunbookServer.java
  Environment:

To remove this server, run: claude mcp remove runbook -s user
```

```text
Checking MCP server health…

runbook: java …\mcp-runbook\RunbookServer.java - ✔ Connected
```

`✔ Connected` means Claude Code started the process and completed the handshake — no model was involved.

### Step 5: Use it in a session

```bash
claude
```

```text
/mcp
```

**Expected result:** `runbook` connected, with one tool. Then:

```text
What does our runbook say about rolling back a release?
```

**Expected result:** Claude asks permission to use `mcp__runbook__get_runbook` (topic `rollback`) and answers from the returned text — redeploy the previous image tag, don't roll back migrations, post in #incidents. Approving for the session, or adding `"allow": ["mcp__runbook__get_runbook"]` to settings, stops the prompts.

### Step 6: Try project scope (optional)

To share the server with the team, it goes in `.mcp.json` at the repository root (`claude mcp add --scope project …`), with the server file committed to the repository. Project servers need each developer's approval: until then `claude mcp list` shows the server as `⏸ Pending approval`.

### Step 7: Remove it

```bash
claude mcp remove runbook
claude mcp get runbook
```

**Output** (paths shortened):

```text
Removed MCP server "runbook" from user config
File modified: …\.claude.json
```

```text
No MCP server named "runbook". Run `claude mcp add` to add one.
```

## Verification

- ☐ The hand-driven session prints the five responses above.
- ☐ `claude mcp get runbook` shows user scope and `✔ Connected`.
- ☐ In a session, Claude used `mcp__runbook__get_runbook` after asking permission.
- ☐ The server is removed at the end.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `✘ Failed to connect` | Wrong path, wrong Java on `PATH`, server crashed | Run the server by hand with `session.jsonl`; read stderr |
| Garbled responses or dropped connection | Something printed to stdout besides protocol messages | Log to stderr only |
| Tool never used | Description doesn't match the request | Improve the tool description; ask explicitly |
| Server missing in another project | Added at local scope (the default) | Use user scope, or project scope via `.mcp.json` |

## Security Notes

- An MCP server runs as you, with your permissions. Install only servers whose code you trust; this one you can read in full.
- Tool results enter Claude's context and can carry instructions (prompt injection). Fixed runbook text is low-risk; a server that reads tickets or web pages isn't.
- Never put tokens in `.mcp.json`; use environment-variable expansion and keep values in your environment.

## Cleanup

Step 7 removes the registration. Delete the `mcp-runbook` folder if you no longer need it.

## Completion Checklist

- ☐ Protocol seen by hand: initialize, tools/list, tools/call, errors.
- ☐ Server registered, inspected, used and removed.
- ☐ You can explain local, project and user scope.

## Follow-up Challenges

- Add a fourth topic (`incident`) and see the new value in the `enum` from `tools/list`.
- Add a `PreToolUse` hook with the matcher `mcp__runbook__.*` that appends each call's arguments to a log file.
