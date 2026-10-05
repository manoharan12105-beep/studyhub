# Firewalls and ACLs — Practice

### P1. Return traffic

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** stateful firewall

Which firewall automatically allows the replies of a connection it has allowed?

- A) Stateless packet filter
- B) Stateful firewall
- C) Hub
- D) Router without ACLs

<details>
<summary>Answer</summary>

**Answer:** B) Stateful firewall

</details>

### P2. First match

**Difficulty:** Medium · **Type:** Output · **Concepts:** rule order

Rules: (1) `allow tcp 10.0.0.0/8 → any 22`, (2) `deny tcp 10.5.0.0/16 → any 22`, (3) `deny any`. Is SSH from `10.5.3.4` allowed? How would you fix the intent "everyone in 10/8 except 10.5/16"?

<details>
<summary>Answer</summary>

Allowed — rule 1 matches first, so rule 2 never applies. Swap them: put the specific deny (10.5.0.0/16) before the general allow (10.0.0.0/8).

</details>

### P3. Write the rules

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** stateless return rules

Write stateless rules for a server `10.0.1.10` that must accept HTTPS from anywhere.

<details>
<summary>Answer</summary>

Inbound: allow TCP from any (source ports 1024–65535) to `10.0.1.10` port 443. Outbound: allow TCP from `10.0.1.10` port 443 to any, destination ports 1024–65535. Then deny everything else.

</details>

### P4. Refused or timeout?

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** drop vs reject

`nc -zv 10.0.2.20 5432` from host A fails immediately with "Connection refused"; from host B it hangs and times out. PostgreSQL is running. Interpret.

<details>
<summary>Answer</summary>

From B, something silently drops the packets — a firewall/security group rule not allowing B. From A, packets reach a host that answers with RST: either a firewall configured to reject, or PostgreSQL listening only on another address (e.g. `127.0.0.1`), so nothing listens on `10.0.2.20:5432`. Check `listen_addresses` and `ss -ltn` on the DB server, then the firewall rules.

</details>
