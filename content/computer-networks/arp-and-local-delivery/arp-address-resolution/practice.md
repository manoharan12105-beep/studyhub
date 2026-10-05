# ARP — Practice

### P1. Request destination

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** ARP request

What is the destination MAC address of an ARP request?

- A) The target's MAC
- B) The default gateway's MAC
- C) `ff:ff:ff:ff:ff:ff`
- D) `00:00:00:00:00:00`

<details>
<summary>Answer</summary>

**Answer:** C) `ff:ff:ff:ff:ff:ff`

**Explanation:** The sender does not know the target's MAC, so it broadcasts. (In the ARP payload, the target MAC field is zeros.)

</details>

### P2. Which IP is resolved?

**Difficulty:** Medium · **Type:** Packet flow · **Concepts:** ARP for gateway

Host `10.0.5.20/24`, gateway `10.0.5.1`, empty ARP cache. It sends to (a) `10.0.5.77` and (b) `172.16.1.9`. For which IP does it send an ARP request in each case?

<details>
<summary>Answer</summary>

(a) `10.0.5.77` — same subnet. (b) `10.0.5.1` — the gateway, because `172.16.1.9` is outside `10.0.5.0/24`.

</details>

### P3. Order the steps

**Difficulty:** Medium · **Type:** Packet flow · **Concepts:** ARP sequence

Order: (a) send the data frame, (b) broadcast ARP request, (c) check the ARP cache, (d) target sends unicast reply, (e) store the mapping, (f) decide the next-hop IP.

<details>
<summary>Answer</summary>

(f) → (c) → (b) → (d) → (e) → (a).

</details>

### P4. Replaced server

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** ARP cache

A failed server is replaced with new hardware using the same IP. For a minute or two, some hosts cannot reach it while others can. Explain and give two fixes.

<details>
<summary>Answer</summary>

Hosts with a cached entry still map the IP to the old MAC and send frames to a NIC that no longer exists until the entry expires. Fixes: have the new server send a gratuitous ARP when it comes up (most OSes do), or flush the ARP cache on affected hosts (`ip neigh flush all`, `arp -d *`).

</details>

### P5. Spot the attack

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** ARP spoofing

`arp -a` on two different PCs shows the gateway `192.168.1.1` with the same MAC as PC `192.168.1.66`. What is likely happening and what limits the damage?

<details>
<summary>Answer</summary>

ARP spoofing: `192.168.1.66` is claiming to be the gateway so it receives others' traffic (man-in-the-middle). Damage is limited by encryption — HTTPS, SSH and VPNs keep content confidential and detect tampering (certificate errors). Network fixes: Dynamic ARP Inspection, port security, isolating the offending port.

</details>
