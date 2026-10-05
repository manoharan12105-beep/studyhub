# Troubleshooting Connectivity Problems — Practice

### P1. Diagnose from results

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** DNS failure

`ping 1.1.1.1` succeeds; `ping example.com` fails with "could not find host". What is the most likely problem?

- A) Broken cable
- B) DNS resolution
- C) Wrong subnet mask
- D) The website is down

<details>
<summary>Answer</summary>

**Answer:** B) DNS resolution

</details>

### P2. Which step failed?

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** layered diagnosis

Results: Wi-Fi connected; IP `192.168.1.40/24`, gateway `192.168.1.1`; `ping 192.168.1.1` ✓; `ping 1.1.1.1` ✗ (timeout); other devices on the same Wi-Fi also have no Internet. Where is the problem?

<details>
<summary>Answer</summary>

Beyond the gateway: the router's WAN side, its NAT, the modem/ONT or the ISP. The LAN and the PC are fine. Check the router's WAN status, restart the modem/router, or contact the ISP.

</details>

### P3. Loss pattern

**Difficulty:** Medium · **Type:** Output · **Concepts:** interpreting mtr

mtr shows: hop 3 → 40 % loss; hops 4–9 → 0 % loss; destination 0 % loss. Is there a real problem at hop 3?

<details>
<summary>Answer</summary>

No. Later hops and the destination show no loss, so traffic passes hop 3 fine; that router just rate-limits ICMP replies to probes addressed to it.

</details>

### P4. Partial reachability

**Difficulty:** Hard · **Type:** Troubleshooting · **Concepts:** mask misconfiguration

The network plan is `10.20.5.0/24`, gateway `10.20.5.1`, DNS `10.20.9.53`. A laptop is set to `10.20.5.77/16`. Predict: (a) ping `10.20.5.1`, (b) ping `8.8.8.8`, (c) browsing `example.com`.

<details>
<summary>Answer</summary>

(a) Works (local either way). (b) Works (outside the /16 → via the gateway). (c) Fails: the DNS server `10.20.9.53` looks local under /16, so the laptop ARPs for it, gets no answer, and name resolution fails — so browsing by name fails even though the Internet is reachable by IP.

</details>

### P5. Latency hunt

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** bufferbloat

Ping to `1.1.1.1` is 15 ms normally but 400 ms whenever a large cloud backup uploads. Gateway ping stays 2 ms. Explain and fix.

<details>
<summary>Answer</summary>

The upload saturates the uplink; packets queue in oversized buffers in the router/modem (bufferbloat), so every other packet waits. Fix with QoS/traffic shaping or smart queue management (fq_codel/CAKE), limit the backup's bandwidth, or schedule it off-hours.

</details>
