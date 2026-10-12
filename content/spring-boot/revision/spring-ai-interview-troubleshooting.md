# 30-Minute Spring AI Interview and Troubleshooting

A timed path of symptoms, causes and fixes, plus the traps interviewers set. The behaviours marked "2.0.1" were observed in the lessons' tests.

## Minutes 0–10: Symptom → Cause → Fix

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `No qualifying bean of type 'ChatClient$Builder'` | Two provider starters active, so two `ChatModel` beans | `spring.ai.model.chat=<provider>`, or build clients per model with `ChatClientBuilderConfigurer` |
| `Could not find artifact spring-ai-advisors-vector-store` | 1.x artifact name with the 2.0 BOM | `spring-ai-vector-store-advisor` |
| The client's default temperature is ignored on one request | Request `.options(...)` replaced the defaults (2.0.1) | Repeat the needed defaults in the request options |
| The follow-up question has no context | Missing or changing conversation id | Pass `ChatMemory.CONVERSATION_ID` from the user |
| A custom advisor never runs | It implements only `CallAdvisor` and the call uses `.stream()` | Implement `StreamAdvisor` too |
| The RAG search runs twice per request | `QuestionAnswerAdvisor` at order 0 is inside the tool loop (2.0.1) | Order it before `+300`, for example `+250` |
| Blocked requests appear in memory | The guard is at order 0 and memory at +200 (2.0.1) | Move the guard before memory |
| Off-topic questions get answers | The similarity threshold is 0.0 | Tune a threshold |
| The custom QA template ignores the question | The template is missing `{query}` | Include `{query}` and `{question_answer_context}` |
| A `main` program never exits after RAG | The advisor's default executor threads | Pass a virtual-thread executor |
| A filter throws `IllegalArgumentException` | Type mismatch, such as `year == '2026'` against an int | Match the metadata types |
| 12 requests per failed call | Nested retry layers | Retry in one layer |
| The evaluator fails on "Yes." | It accepts only "yes" (2.0.1) | Make the judge prompt demand exactly yes or no |
| An MCP client gets 404 on `/mcp` | The server protocol is unset, so SSE is exposed (2.0.1) | `spring.ai.mcp.server.protocol=STREAMABLE` |
| An MCP authorization exception | Spring Security protects `/mcp` | Add credentials with an `McpSyncHttpClientRequestCustomizer` |

## Minutes 10–20: Interview Traps

- **"Spring AI makes apps portable."** The API is portable; quality, limits and features are not. Re-evaluate after switching.
- **"Temperature 0 is deterministic."** It lowers variance only.
- **"Structured output is validated output."** It is parsed, not validated.
- **"The model calls my tool."** The application calls it after the model requests it.
- **"Memory stores everything."** The memory advisor runs outside the tool loop and stores user and final assistant messages.
- **"Prompts prevent injection."** Limit what an injection can do with tool design and authorisation.
- **"Fine-tune to add company knowledge."** Use RAG for facts that change or need citations.
- **"Agents are the goal."** Use workflows when the steps are known.

## Minutes 20–30: Answer Practice

Answer each one aloud in under a minute, then check the lesson:

1. Walk through one request with memory, RAG and a tool: which advisor runs when? ([Advisor Ordering](../spring-ai-tools-and-advisors/advisor-ordering-and-transformations/content.md))
2. Design a document Q&A service with sources and refusals. ([Project 2](../spring-ai-projects/project-document-qa/content.md))
3. Make a refund tool safe. ([Human Approval](../spring-ai-advanced/human-approval-for-tools/content.md))
4. Cut the AI bill by half without losing quality. ([Tokens and Cost](../spring-ai-production/token-usage-and-cost-control/content.md))
5. Test the AI layer in CI without keys. ([Testing AI Services](../spring-ai-production/testing-ai-services/content.md))
