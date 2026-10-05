# Application Layer Protocols: FTP, Telnet, SNMP and the Protocol Map

**Module:** Application Layer · **Interview priority:** Core

## What Is It?

The **application layer** contains the protocols that applications speak to each other: HTTP for the web, DNS for names, SMTP for mail, SSH for remote shells. They define the **messages and their meaning**; they rely on TCP or UDP for delivery.

This topic is the map of the layer plus the protocols that do not get their own topic (FTP, Telnet, SNMP, NTP). The big ones have their own modules: [HTTP](../../http/http-fundamentals/content.md), [HTTPS/TLS](../../https-and-tls/tls-handshake-and-https/content.md), [DNS](../../dns/dns-fundamentals/content.md), [DHCP](../../dhcp/dhcp-dora/content.md), [email](../email-protocols-smtp-pop3-imap/content.md) and [SSH](../ssh-protocol/content.md).

## Why It Exists

TCP delivers bytes; it does not say what they mean. Two programs must agree on: how a request looks, which commands exist, how responses and errors are expressed, and who speaks when. Each application protocol is that agreement for one kind of task.

## How It Works

### Common design patterns

| Pattern | Examples |
|---------|----------|
| **Client-server, request/response** | HTTP, DNS, SMTP, FTP |
| **Text-based commands** (human-readable; you can type them with `telnet`/`nc`) | HTTP/1.1, SMTP, FTP, POP3, IMAP |
| **Binary** (compact, faster to parse) | HTTP/2, DNS, SSH, TLS, SNMP |
| **Stateless** (each request independent) | HTTP |
| **Stateful sessions** | FTP, SMTP, IMAP, SSH |
| **Well-known server port** | 80, 443, 22, 25, 53 … |

### The protocol map

| Protocol | Purpose | Transport · Port | Secure version |
|----------|---------|------------------|----------------|
| HTTP | Web pages, APIs | TCP 80 | HTTPS (TCP 443; HTTP/3 over UDP 443) |
| DNS | Name → IP | UDP/TCP 53 | DoT (TCP 853), DoH (443) |
| DHCP | Automatic IP configuration | UDP 67 (server) / 68 (client) | — |
| FTP | File transfer | TCP 21 control, 20 data (active) | FTPS, or use SFTP (SSH) |
| SSH | Secure remote shell, tunnels, file transfer (SCP/SFTP) | TCP 22 | (is secure) |
| Telnet | Remote terminal, unencrypted | TCP 23 | Replaced by SSH |
| SMTP | Sending/relaying mail | TCP 25 (relay), 587 (submission), 465 (implicit TLS) | STARTTLS / TLS |
| POP3 | Downloading mail | TCP 110 | POP3S 995 |
| IMAP | Accessing mail on the server | TCP 143 | IMAPS 993 |
| SNMP | Monitoring and managing network devices | UDP 161 (queries), 162 (traps) | SNMPv3 (auth + encryption) |
| NTP | Clock synchronisation | UDP 123 | NTS |
| LDAP | Directory lookups (users, groups) | TCP 389 | LDAPS 636 |
| RDP | Windows remote desktop | TCP/UDP 3389 | (TLS) |

## FTP (File Transfer Protocol)

- One of the oldest Internet protocols. Uses **two connections**: a **control** connection (TCP 21) for commands like `USER`, `PASS`, `LIST`, `RETR file`, `STOR file`, and a separate **data** connection for each file or listing.
- **Active mode:** the server connects *back* to the client from port 20 — fails behind NAT and firewalls.
- **Passive mode:** the client opens the data connection to a port the server announces — the usual mode today.
- **Sends passwords in clear text.** Use **SFTP** (file transfer over SSH, port 22) or FTPS (FTP over TLS) instead.

## Telnet

- Remote terminal over TCP 23: everything — including your password — travels **unencrypted**. Replaced by SSH.
- The `telnet host port` *client* is still handy to test whether a TCP port is open and to type text protocols by hand (though `nc` and `curl` are better tools).

## SNMP (Simple Network Management Protocol)

- How monitoring systems read the state of routers, switches, printers and servers: interface counters, CPU, errors.
- A **manager** (monitoring server) polls **agents** on devices with `GET` requests (UDP 161); agents send **traps** (alerts) to the manager on UDP 162.
- Data is organised in a tree described by the **MIB**, addressed by **OIDs** (e.g. interface traffic counters).
- v1/v2c use a plaintext "community string" as a password; **v3** adds authentication and encryption.

## Real World

- A backend service usually speaks HTTP (REST/gRPC over HTTP/2) to clients, a binary database protocol to PostgreSQL (TCP 5432), and DNS everywhere.
- Infrastructure monitoring (Prometheus exporters, Zabbix, network monitoring tools) still uses SNMP for network gear.

## Common Traps

- **"FTP is fine for internal use."** Credentials and data are readable by anyone on the path; use SFTP.
- **"SFTP is FTP over TLS."** SFTP is a different protocol running inside SSH; FTP over TLS is FTPS.
- **"Telnet is the same as SSH without encryption."** Different protocols; the comparison is about purpose (remote terminal).

## Interview Follow-up

- *"Why does FTP use two connections?"* To separate commands from data; the control channel stays open while files flow on data connections.
- *"Which protocols send passwords in clear text?"* Telnet, FTP, HTTP (Basic auth without TLS), POP3/IMAP without TLS, SNMP v1/v2c.

## Key Takeaways

- Application protocols define messages and meaning; TCP/UDP carry them.
- Know the port map: 20/21 FTP, 22 SSH, 23 Telnet, 25/587 SMTP, 53 DNS, 67/68 DHCP, 80/443 HTTP(S), 110/995 POP3, 143/993 IMAP, 161/162 SNMP, 123 NTP.
- FTP: control (21) + data connections, clear text → prefer SFTP. Telnet: clear text → SSH. SNMP: polling agents (161) and traps (162); v3 for security.
