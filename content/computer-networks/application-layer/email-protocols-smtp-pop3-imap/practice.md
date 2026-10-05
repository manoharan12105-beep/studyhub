# How Email Works — Practice

### P1. Sending protocol

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** SMTP

Which protocol transfers mail between mail servers?

- A) IMAP
- B) POP3
- C) SMTP
- D) SNMP

<details>
<summary>Answer</summary>

**Answer:** C) SMTP

</details>

### P2. Which record?

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** MX records

A mail server must deliver to `user@example.org`. Which DNS record type does it query first?

<details>
<summary>Answer</summary>

**MX** for `example.org`, then the A/AAAA record of the chosen mail host.

</details>

### P3. Choose POP3 or IMAP

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** POP3 vs IMAP

A user reads mail on a phone, a laptop and webmail and wants read status and folders to match everywhere. Which protocol, and why does the other one fail?

<details>
<summary>Answer</summary>

IMAP — mail and state stay on the server and sync to every device. POP3 would download messages to whichever device fetched first (often removing them from the server), so the others would not see them.

</details>

### P4. App cannot send

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** SMTP ports

A Spring Boot app on a cloud VM times out connecting to `smtp.provider.com:25`. What is a likely cause and fix?

<details>
<summary>Answer</summary>

Many cloud providers block outbound TCP 25 to prevent spam. Use the submission port 587 with STARTTLS (or 465 with implicit TLS) and authenticate to the mail provider.

</details>
