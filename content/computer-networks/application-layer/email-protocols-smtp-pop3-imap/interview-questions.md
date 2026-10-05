# How Email Works — Interview Questions

## Beginner

### Q1. Which protocols are used for sending and receiving email?

<details>
<summary>Answer</summary>

SMTP sends mail — from the client to its mail server (port 587/465) and between mail servers (port 25). POP3 (110/995) or IMAP (143/993) let clients retrieve mail from their mailbox. Webmail uses HTTPS between the browser and the provider.

</details>

### Q2. What is the difference between POP3 and IMAP?

**Style:** Comparison

<details>
<summary>Answer</summary>

POP3 downloads messages to one device and usually deletes them from the server — no folders or synced read state, poor for multiple devices. IMAP keeps mail on the server and synchronises folders, flags and read status across all devices; clients cache copies. IMAP is the norm today.

</details>

## Intermediate

### Q3. Describe what happens when you send an email to someone at another provider.

**Style:** What happens internally

<details>
<summary>Answer</summary>

Your client submits the message via authenticated SMTP (587, TLS) to your provider's server. That server looks up the recipient domain's MX record in DNS, connects to the recipient's mail server on port 25 and relays the message with SMTP (queuing and retrying if it is unavailable). The recipient's server checks SPF/DKIM/DMARC and spam rules and stores it in the mailbox, where the recipient's client reads it with IMAP/POP3 or webmail.

</details>

### Q4. What role does DNS play in email?

<details>
<summary>Answer</summary>

MX records name the mail servers (with priorities) that accept mail for a domain; the sender resolves them, then the servers' A/AAAA records. TXT records publish SPF (allowed sending IPs), DKIM public keys and the DMARC policy used to authenticate the sender's domain.

</details>

## Advanced

### Q5. How can an email appear to come from your CEO when it did not? How do SPF, DKIM and DMARC help?

**Style:** Scenario

<details>
<summary>Answer</summary>

SMTP does not verify the From header, so anyone can write it. SPF lets the receiving server check whether the sending IP is authorised for the envelope domain; DKIM verifies a cryptographic signature from the domain over the message; DMARC requires that one of them passes and aligns with the visible From domain, and tells receivers to quarantine or reject failures. With DMARC enforced, spoofed mail from the company domain is rejected. Look-alike domains still need user awareness.

</details>
