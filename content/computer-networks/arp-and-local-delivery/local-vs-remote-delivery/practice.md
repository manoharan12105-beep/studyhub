# Local vs Remote Delivery — Practice

### P1. Local or remote?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** subnet decision

Host `192.168.10.25/24` sends to `192.168.11.25`. What happens?

- A) It ARPs for `192.168.11.25` and sends directly
- B) It ARPs for its default gateway and sends the frame there
- C) It broadcasts the packet
- D) It drops the packet

<details>
<summary>Answer</summary>

**Answer:** B) It ARPs for its default gateway and sends the frame there

**Explanation:** `192.168.11.0` ≠ `192.168.10.0` under a `/24` mask, so the destination is remote.

</details>

### P2. Fill in the frame

**Difficulty:** Medium · **Type:** Packet flow · **Concepts:** router MAC vs destination MAC

Host H (`10.1.1.50/24`, MAC `H`), gateway G (`10.1.1.1`, MAC `G`), server S (`10.2.2.80`, MAC `S`). Give dst MAC and dst IP of the frame H sends to S.

<details>
<summary>Answer</summary>

dst MAC = `G`, dst IP = `10.2.2.80`.

</details>

### P3. Mask decides

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** subnet mask

Host `172.16.5.130/25` sends to `172.16.5.100`. Local or remote?

<details>
<summary>Answer</summary>

`/25` splits `172.16.5.0/24` into `.0–.127` and `.128–.255`. The host is in `172.16.5.128/25`; `.100` is in `172.16.5.0/25`. **Remote** — sent via the gateway.

</details>

### P4. Diagnose

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** wrong default gateway

A PC can reach the printer and file server on its subnet, but not the Internet or any other subnet. `ipconfig` shows the default gateway as `192.168.1.254`, but the router is `192.168.1.1`. Explain the symptoms.

<details>
<summary>Answer</summary>

Local traffic does not use the gateway, so it works. All remote traffic is sent to `192.168.1.254`; no router answers ARP for it (or the host there does not route), so remote packets never leave the subnet. Fix the gateway (usually via the DHCP server's options).

</details>

### P5. Wrong mask

**Difficulty:** Hard · **Type:** Troubleshooting · **Concepts:** mask too large

The correct network is `10.10.20.0/24` with DNS server `10.10.30.5` in another subnet. A host is misconfigured as `10.10.20.40/16`. Which of these work: (a) ping `10.10.20.1`, (b) ping `8.8.8.8`, (c) DNS lookups via `10.10.30.5`?

<details>
<summary>Answer</summary>

(a) works (local in both views). (b) works (`8.8.8.8` is outside `10.10.0.0/16`, so it goes to the gateway). (c) fails: with `/16`, `10.10.30.5` looks local, so the host ARPs for it, nobody on the LAN answers, and DNS fails — names stop resolving although the Internet is reachable by IP.

</details>
