# Application Layer Protocols — Practice

### P1. Insecure protocol

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** clear-text protocols

Which protocol sends login passwords unencrypted?

- A) SSH
- B) Telnet
- C) HTTPS
- D) SFTP

<details>
<summary>Answer</summary>

**Answer:** B) Telnet

</details>

### P2. Identify the protocol

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** protocol purpose

Which protocol: (a) a monitoring server reads a switch's interface counters, (b) your laptop's clock is synchronised, (c) a mail server forwards mail to another, (d) you upload a file securely to a Linux server.

<details>
<summary>Answer</summary>

(a) SNMP, (b) NTP, (c) SMTP, (d) SFTP/SCP (over SSH).

</details>

### P3. Firewall rule

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** ports and transports

Write which protocol/port pairs a firewall must allow for: DNS queries, SSH administration, HTTPS including HTTP/3, SNMP polling and traps.

<details>
<summary>Answer</summary>

DNS: UDP 53 (and TCP 53). SSH: TCP 22. HTTPS: TCP 443 and UDP 443 (HTTP/3). SNMP: UDP 161 (polling, to devices) and UDP 162 (traps, to the manager).

</details>

### P4. FTP behind NAT

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** active vs passive FTP

A client behind a home router logs in to an FTP server successfully, but `ls` hangs. Explain and fix.

<details>
<summary>Answer</summary>

The control connection works, but in active mode the server tries to open the data connection back to the client, which the home router's NAT/firewall blocks. Switch the client to passive mode (`passive` command / client setting) — or better, use SFTP.

</details>
