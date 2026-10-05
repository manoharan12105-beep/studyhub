# OSI Layers 5, 6 and 7 — Interview Questions

## Beginner

### Q1. What does the Presentation layer do?

<details>
<summary>Answer</summary>

It makes data understandable between systems: translation and encoding (character sets like UTF-8, serialisation like JSON, byte order), encryption and decryption (TLS is usually placed here), and compression (gzip). It is sometimes called the translator of the network.

</details>

### Q2. What is the job of the Session layer?

<details>
<summary>Answer</summary>

Establishing, maintaining and terminating sessions (dialogues) between applications, dialogue control (who sends when), and synchronisation with checkpoints so that a long transfer can resume after a failure. In TCP/IP these functions are handled by applications, e.g. TLS session resumption or HTTP connection reuse.

</details>

### Q3. Is a web browser a Layer 7 component?

**Style:** Follow-up

<details>
<summary>Answer</summary>

The browser is an application that *uses* Layer 7 protocols (HTTP, DNS, WebSocket). The Application layer is the set of network services and protocols, not the user-facing program.

</details>

## Intermediate

### Q4. Why does the TCP/IP model not have separate session and presentation layers?

**Style:** Why

<details>
<summary>Answer</summary>

Their functions are application-specific — how to encode data, whether to encrypt or compress, how to manage a dialogue — so TCP/IP leaves them to each application and its libraries (TLS, JSON parsers, compression). A single generic session or presentation protocol was never needed; OSI's separate layers did not catch on in practice.

</details>

## Advanced

### Q5. Map the parts of an HTTPS JSON API call to layers 5, 6 and 7.

**Style:** What happens internally

<details>
<summary>Answer</summary>

Layer 7: HTTP request semantics — method, path, headers, status (`POST /api/orders`, `201 Created`). Layer 6: JSON serialisation in UTF-8, `Content-Encoding: gzip` compression, and TLS encryption of the HTTP bytes. Layer 5: keeping the dialogue — HTTP keep-alive or an HTTP/2 connection carrying many requests, and TLS session resumption on reconnects.

</details>
