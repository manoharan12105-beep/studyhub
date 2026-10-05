# Routers, Gateways, Modems and Access Points — Practice

### P1. Which device?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** router

Which device chooses a path for a packet based on its destination IP address?

- A) Hub
- B) Switch
- C) Router
- D) Modem

<details>
<summary>Answer</summary>

**Answer:** C) Router

</details>

### P2. Valid default gateway

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** default gateway

A PC is `10.1.5.20/24`. Which can be its default gateway: `10.1.5.1`, `10.1.6.1`, `10.1.5.254`?

<details>
<summary>Answer</summary>

`10.1.5.1` and `10.1.5.254` — both are in `10.1.5.0/24`, the PC's own subnet. `10.1.6.1` is in another subnet; the PC could not reach it directly (it would need a router to get there).

</details>

### P3. What stays, what changes?

**Difficulty:** Medium · **Type:** Packet flow · **Concepts:** routing, frame rewrite

A packet from `192.168.1.10` to `198.51.100.7` crosses three routers (no NAT). After the first router, which of these have changed: source IP, destination IP, source MAC, destination MAC, TTL?

<details>
<summary>Answer</summary>

Changed: source MAC (now the router's outgoing interface), destination MAC (now the next router), TTL (decremented by 1). Unchanged: source and destination IP addresses.

</details>

### P4. Home box

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** home router functions

Your ISP box has four LAN ports, Wi-Fi, a fibre input, and gives your devices `192.168.1.x` addresses. Name the device functions inside it and the job of each.

<details>
<summary>Answer</summary>

ONT/modem (converts the fibre signal), router (forwards between LAN and ISP), NAT (translates private addresses to the one public address), DHCP server (gives out `192.168.1.x`, mask, gateway, DNS), switch (the four LAN ports), access point (Wi-Fi), firewall (blocks unsolicited inbound traffic), often a DNS forwarder.

</details>
