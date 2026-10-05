# Application Layer Protocols — Interview Questions

## Beginner

### Q1. Name common application-layer protocols and their ports.

<details>
<summary>Answer</summary>

HTTP 80, HTTPS 443, DNS 53, DHCP 67/68, FTP 20/21, SSH 22, Telnet 23, SMTP 25 (587 submission), POP3 110 (995 secure), IMAP 143 (993 secure), SNMP 161/162, NTP 123.

</details>

### Q2. What is the difference between Telnet and SSH?

**Style:** Comparison

<details>
<summary>Answer</summary>

Both provide remote terminal access over TCP. Telnet (port 23) sends everything — including usernames and passwords — in clear text and does not authenticate the server. SSH (port 22) encrypts the session, verifies the server's host key, supports key-based authentication, and adds features like tunnelling and file transfer (SCP/SFTP). Telnet should not be used for remote administration.

</details>

## Intermediate

### Q3. Why does FTP use two connections, and what is the problem with active mode?

<details>
<summary>Answer</summary>

FTP separates control (commands and replies on TCP 21, kept open for the session) from data (a new connection per file transfer or directory listing). In active mode the server opens the data connection back to the client, which NAT and client firewalls block. Passive mode — the client opens the data connection to a port the server announces — avoids that.

</details>

### Q4. What are SFTP and FTPS?

**Style:** Comparison

<details>
<summary>Answer</summary>

SFTP is the SSH File Transfer Protocol — a completely different protocol that runs inside an SSH session on port 22, using one connection. FTPS is classic FTP wrapped in TLS (explicit via `AUTH TLS` on port 21, or implicit on 990), still with separate control and data connections. Both encrypt; SFTP is simpler through firewalls.

</details>

## Advanced

### Q5. What is SNMP and how does it work?

<details>
<summary>Answer</summary>

The Simple Network Management Protocol lets a manager monitor and configure network devices. The manager polls agents with GET/GETNEXT/GETBULK (and SET) over UDP 161, reading values identified by OIDs in the device's MIB (interface counters, CPU, status); agents push asynchronous traps or informs to the manager on UDP 162. SNMPv1/v2c authenticate with a clear-text community string; SNMPv3 adds user authentication and encryption.

</details>
