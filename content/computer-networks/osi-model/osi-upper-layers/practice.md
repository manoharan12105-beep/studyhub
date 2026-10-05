# OSI Layers 5, 6 and 7 — Practice

### P1. Presentation function

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** presentation layer

Which is a Presentation-layer function?

- A) Choosing a route
- B) Converting a Java object to JSON in UTF-8
- C) Assigning a port number
- D) Detecting a collision

<details>
<summary>Answer</summary>

**Answer:** B) Converting a Java object to JSON in UTF-8

</details>

### P2. Classify

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** layers 5–7

Assign to Session, Presentation or Application: (a) gzip compression of a response, (b) resuming a TLS session without a full handshake, (c) the HTTP `GET` method, (d) DNS, (e) JPEG encoding.

<details>
<summary>Answer</summary>

(a) Presentation, (b) Session, (c) Application, (d) Application, (e) Presentation.

</details>

### P3. Garbled text

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** encoding

An API returns names like `Ã©` instead of `é`. The HTTP status is 200 and the connection is fine. Which layer's function is wrong, and what is the likely cause?

<details>
<summary>Answer</summary>

Presentation (character encoding). The server sent UTF-8 bytes but the client decoded them as ISO-8859-1 (or the reverse). Fix by sending and honouring `Content-Type: application/json; charset=UTF-8` (JSON is UTF-8 by standard).

</details>

### P4. Checkpointing

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** session synchronisation

A 4 GB download fails at 3.5 GB. How can HTTP resume it without restarting, and which OSI function is this similar to?

<details>
<summary>Answer</summary>

The client sends `Range: bytes=3758096384-` (from the byte it already has) and the server replies `206 Partial Content`. This resembles the Session layer's synchronisation/checkpoint function.

</details>
