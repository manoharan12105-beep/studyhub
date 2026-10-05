# Interview Questions: Scenarios, Debugging and "What Happens Internally"

**Module:** Interview Preparation · **Interview priority:** Core

## What Is It?

A bank of [scenario and debugging questions](interview-questions.md) — the open-ended format used in later technical rounds: "What happens when you type a URL?", "How would you troubleshoot no internet?", "Why can you ping an IP but not a domain?", "Our API returns 504 — what do you check?"

## Why It Matters

Scenario questions have no single memorised answer. They test whether you can **combine** layers, form hypotheses, choose the right tool for each step and explain trade-offs. They are the questions that separate candidates in backend and full-stack interviews.

## Core Concept

### A framework for every scenario

1. **Clarify** — who/what is affected, since when, what changed, the exact error.
2. **Hypothesise by layer** — which layers could produce this symptom?
3. **Test cheapest first** — one command per hypothesis (`ipconfig`, `ping`, `nslookup`, `nc`, `curl -v`, logs).
4. **Interpret** — what each result proves and rules out.
5. **Fix and prevent** — the immediate fix, then monitoring/automation so it does not recur.

For "what happens internally" questions, narrate the flow **in order**, naming the protocol, the addresses involved and where caching or failure can occur.

### Coverage

[URL journey](../../end-to-end-flows/url-to-webpage-journey/content.md) · [Packet journey](../../end-to-end-flows/packet-journey-across-networks/content.md) · [Backend flows](../../end-to-end-flows/backend-request-flows/content.md) · [Methodology](../../troubleshooting/network-troubleshooting-methodology/content.md) · [Connectivity problems](../../troubleshooting/troubleshooting-connectivity-problems/content.md) · [Connection errors](../../troubleshooting/troubleshooting-connection-errors/content.md)

## Key Takeaways

- Structure beats speed: clarify → hypothesise by layer → test → interpret → fix → prevent.
- Name a concrete command and what its result proves.
- For flows, keep strict order and mention caches and failure points.
