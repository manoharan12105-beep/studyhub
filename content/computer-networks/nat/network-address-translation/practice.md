# NAT — Practice

### P1. Home router

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** PAT

Which kind of NAT does a typical home router perform?

- A) Static NAT
- B) Dynamic NAT with a pool
- C) PAT (NAT overload)
- D) No NAT

<details>
<summary>Answer</summary>

**Answer:** C) PAT (NAT overload)

</details>

### P2. Translate the packet

**Difficulty:** Medium · **Type:** Packet flow · **Concepts:** translation table

Router public IP `198.51.100.7`. Phone `192.168.0.5:61000` connects to `203.0.113.80:443`; the router assigns public port 50500. Write the packet as it leaves the router, the reply as it arrives at the router, and the reply as delivered to the phone.

<details>
<summary>Answer</summary>

Leaving: `198.51.100.7:50500 → 203.0.113.80:443`.
Reply arriving: `203.0.113.80:443 → 198.51.100.7:50500`.
Delivered: `203.0.113.80:443 → 192.168.0.5:61000`.

</details>

### P3. Unsolicited inbound

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** inbound connections, port forwarding

A friend tries to connect to your home Minecraft server at your public IP, port 25565. Nothing happens. Why, and what is the fix?

<details>
<summary>Answer</summary>

The router has no translation entry for an inbound connection to port 25565, so it drops it. Add a port-forwarding rule: public TCP 25565 → your PC's private IP:25565 (and give the PC a DHCP reservation, and allow it in the PC's firewall). If your ISP uses CGNAT, it cannot work without a public IP or a relay/tunnel.

</details>

### P4. NAT type

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** NAT types

Classify: (a) internal web server `10.0.0.10` always appears as `203.0.113.10`; (b) 500 laptops share `203.0.113.11`; (c) 20 PCs get any free address from `203.0.113.32–47` while connected.

<details>
<summary>Answer</summary>

(a) Static NAT, (b) PAT, (c) dynamic NAT.

</details>

### P5. Idle connection

**Difficulty:** Hard · **Type:** Troubleshooting · **Concepts:** NAT timeouts

A service keeps a database connection open through a NAT gateway. After 10 idle minutes, the next query hangs and then fails. Explain and fix.

<details>
<summary>Answer</summary>

The NAT gateway dropped the idle mapping (idle timeout), so packets on the old connection are no longer translated and disappear; the app only notices after a TCP timeout. Fix: enable TCP keep-alive (shorter than the NAT idle timeout), set the connection pool's max idle time / keep-alive below it, or validate connections before use.

</details>
