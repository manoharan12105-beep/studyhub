# How Email Works: SMTP, POP3 and IMAP

**Module:** Application Layer · **Interview priority:** Frequently asked

## What Is It?

Email uses different protocols for **sending** and **reading**:

| Protocol | Job | Port |
|----------|-----|------|
| **SMTP** (Simple Mail Transfer Protocol) | **Push** mail: from your client to your mail server, and from server to server | 25 (server-to-server), 587 (client submission, STARTTLS), 465 (submission with implicit TLS) |
| **POP3** (Post Office Protocol v3) | **Pull** mail: download to one device, usually delete from the server | 110 / 995 (TLS) |
| **IMAP** (Internet Message Access Protocol) | **Access** mail kept on the server, synced across devices | 143 / 993 (TLS) |

**DNS MX records** tell senders which server receives mail for a domain.

## Why It Exists

Email is asynchronous: the recipient may be offline. So mail is pushed to the **recipient's mail server**, which stores it until the recipient's client fetches it. One protocol (SMTP) moves mail between always-on servers; others (POP3, IMAP) let intermittently connected clients read their mailbox.

## How It Works

### The journey of one email

`alice@example.com` sends to `bob@example.org`:

```text
Alice's client ──SMTP 587──► smtp.example.com (Alice's provider: MSA/MTA)
                                    │ 1. DNS: MX record for example.org?
                                    │    → mx1.example.org (priority 10)
                                    │ 2. SMTP 25 to mx1.example.org
                                    ▼
                             mx1.example.org (Bob's provider: MTA → mailbox)
                                    │ stores the message
Bob's phone / laptop ◄──IMAP 993──┘ (or POP3 995)
```

1. Alice's client **submits** the message with SMTP to her provider (port 587, authenticated, TLS).
2. Her server looks up the **MX record** of `example.org` in DNS.
3. It **relays** the message with SMTP over port 25 to Bob's mail server. If that server is unreachable, it queues and retries for days.
4. Bob's server checks it (SPF, DKIM, DMARC, spam filters) and stores it in Bob's mailbox.
5. Bob's devices **read** it with IMAP (or POP3).

### An SMTP conversation

SMTP is a text protocol of commands and three-digit replies:

```text
S: 220 mx1.example.org ESMTP ready
C: EHLO smtp.example.com
S: 250-mx1.example.org
S: 250 STARTTLS
   (in practice the client now sends STARTTLS and repeats EHLO over TLS)
C: MAIL FROM:<alice@example.com>
S: 250 OK
C: RCPT TO:<bob@example.org>
S: 250 OK
C: DATA
S: 354 End data with <CR><LF>.<CR><LF>
C: Subject: Hello
C:
C: Hi Bob!
C: .
S: 250 Queued as 4F2A1
C: QUIT
S: 221 Bye
```

The **envelope** (`MAIL FROM`, `RCPT TO`) decides delivery; the `From:`/`To:` **headers** inside the message are what the user sees — they can differ, which is why spoofing is possible and why SPF/DKIM/DMARC exist.

### POP3 vs IMAP

| | POP3 | IMAP |
|---|------|------|
| Model | Download and (usually) delete | Mail stays on the server; clients sync |
| Multiple devices | Poor — each device sees a different subset | Designed for it — read state, folders sync everywhere |
| Folders, flags | No (inbox only) | Yes |
| Offline | Mail stored locally | Cached copies; server is the source of truth |
| Server storage | Low | Higher |
| Today | Rare | Standard (phones, Outlook, Thunderbird) |

Webmail (Gmail in a browser) uses **HTTPS** between your browser and the provider; SMTP is still used between mail servers.

### Email authentication (anti-spoofing)

| Mechanism | DNS record | Checks |
|-----------|------------|--------|
| **SPF** | TXT `v=spf1 …` | Is this sending IP allowed to send for the domain? |
| **DKIM** | TXT with a public key | Is the message signed by the domain and unaltered? |
| **DMARC** | TXT `_dmarc.domain` | What to do when SPF/DKIM fail; alignment with the visible From |

## Real World

- A Spring Boot app sends mail (password resets, invoices) as an SMTP **client** to a provider (`spring.mail.host`, port 587, STARTTLS) — it should not run its own mail server.
- Cloud providers block outbound port 25 from VMs by default to stop spam; use 587 to a mail service.
- "My emails go to spam" is usually missing SPF/DKIM/DMARC records — a DNS fix.

## Common Traps

- **"SMTP is used to read email."** SMTP only sends/relays; POP3/IMAP (or HTTPS for webmail) read.
- **"Email goes directly from the sender's PC to the recipient's PC."** It goes through both providers' servers and waits in the recipient's mailbox.
- **"The From address proves who sent it."** It can be forged; SPF/DKIM/DMARC verify the domain.

## Interview Follow-up

- *"Which DNS record is used for email delivery?"* MX (plus TXT for SPF/DKIM/DMARC).
- *"POP3 vs IMAP?"* Download-and-delete for one device vs server-side mailbox synced across devices.

## Key Takeaways

- SMTP pushes mail (client → server on 587, server → server on 25); POP3/IMAP pull it.
- MX records route mail to the recipient's server; mail waits there until fetched.
- IMAP keeps mail on the server and syncs devices; POP3 downloads it.
- SPF, DKIM, DMARC (TXT records) fight spoofing.
