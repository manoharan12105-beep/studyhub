# OSI Layers 5, 6 and 7: Session, Presentation and Application

**Module:** OSI Model · **Interview priority:** Frequently asked

## What Is It?

The upper three layers deal with the **conversation and the data itself**, not with moving bits:

| | Layer 5 — Session | Layer 6 — Presentation | Layer 7 — Application |
|---|-------------------|------------------------|-----------------------|
| Job | Establish, manage and end **dialogues** | Translate, encode, **encrypt**, compress data | Provide **network services** to applications |
| Question it answers | "Are we still in the same conversation?" | "In what format is the data?" | "What does the user/program want?" |
| Examples | Session setup/teardown, checkpoints, RPC sessions, NetBIOS; TLS session resumption | TLS encryption, character encoding (UTF-8, ASCII), JSON/XML serialisation, JPEG/MP4, gzip | HTTP, DNS, SMTP, IMAP, FTP, SSH, DHCP |
| PDU | Data | Data | Data / message |

## Why It Exists

Once data reliably reaches the right application (Layer 4), three problems remain: keeping track of a longer dialogue, agreeing on how data is represented so both sides understand it, and defining what the application actually asks for.

## Layer 5 — Session

- **Establishment, maintenance, termination** of a session (a logical dialogue that may span several transport connections).
- **Dialogue control:** who may send when (full or half duplex at the conversation level).
- **Synchronisation / checkpoints:** in a long transfer, resume from the last checkpoint after a failure instead of starting over.

In the TCP/IP world there is no separate session protocol; applications do this themselves. Examples you will actually see:

| Session-like feature | Where |
|----------------------|-------|
| TLS session resumption | Skips part of the handshake when reconnecting |
| HTTP keep-alive / HTTP/2 connection reuse | One connection carries many requests |
| Login sessions (`JSESSIONID` cookie) | Application-level, but often given as an example |
| Resumable downloads (`Range` requests) | HTTP checkpointing |

## Layer 6 — Presentation

The "translator" of the network: makes data from one system understandable to another.

| Function | Example |
|----------|---------|
| **Translation / encoding** | Characters as UTF-8; Java object → JSON (Jackson); integers in network byte order (big-endian) |
| **Encryption / decryption** | TLS encrypts HTTP data before it reaches TCP |
| **Compression** | gzip or Brotli on HTTP responses (`Content-Encoding: gzip`) |
| **Media formats** | JPEG, PNG, MP3, MP4 |

## Layer 7 — Application

The layer the user's software talks to — the **network service**, not the application program itself. Chrome is not Layer 7; **HTTP** is. Outlook is not Layer 7; **SMTP and IMAP** are.

| Protocol | Service | Port |
|----------|---------|------|
| HTTP / HTTPS | Web and APIs | 80 / 443 |
| DNS | Name resolution | 53 |
| DHCP | Automatic IP configuration | 67/68 |
| SMTP | Sending mail | 25, 587 |
| POP3 / IMAP | Reading mail | 110 / 143 (995 / 993 with TLS) |
| FTP | File transfer | 21 (+20 data) |
| SSH | Secure remote shell | 22 |

More: [Application Layer Protocols](../../application-layer/application-layer-protocols/content.md).

## How They Map to Real Software

In the TCP/IP model these three layers collapse into **one Application layer**, and the work happens inside the application and its libraries:

```text
Spring Boot service
 ├─ Layer 7: Spring MVC handles GET /api/orders/7 (HTTP semantics)
 ├─ Layer 6: Jackson converts Order → JSON (UTF-8); gzip compression; TLS (in Tomcat/JDK) encrypts
 └─ Layer 5: HTTP keep-alive / TLS session keeps the dialogue open
```

## Common Traps

- **"The browser is a Layer 7 device."** Applications *use* Layer 7 protocols; the layer is the protocol/service, not the program.
- **"Session layer = login session."** OSI's session layer manages communication dialogues; a login session (cookie) is application logic. Mention it only as an analogy.
- **"Encryption is always Layer 6."** TLS is commonly *placed* there because it encrypts application data, but IPsec encrypts at Layer 3 and Wi-Fi WPA encrypts at Layer 2. Encryption can happen at several layers.

## Interview Follow-up

- *"Where is JSON serialisation in OSI?"* Presentation layer (data representation).
- *"Why do people say the session and presentation layers 'don't exist'?"* TCP/IP has no separate protocols for them; their functions live inside application protocols and libraries.

## Key Takeaways

- Session (5): opens, manages, checkpoints and closes dialogues.
- Presentation (6): encoding, serialisation, encryption, compression — the translator.
- Application (7): network services such as HTTP, DNS, SMTP, SSH — not the application program itself.
- In TCP/IP these three are one Application layer, implemented by applications and libraries.
