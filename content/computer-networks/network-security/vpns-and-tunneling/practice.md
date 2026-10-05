# VPNs and Tunnelling — Practice

### P1. VPN type

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** VPN types

An on-premises data centre is permanently connected to an AWS VPC through two IPsec gateways. Which VPN type is this?

- A) Remote-access VPN
- B) Site-to-site VPN
- C) SSH tunnel
- D) Consumer privacy VPN

<details>
<summary>Answer</summary>

**Answer:** B) Site-to-site VPN

</details>

### P2. Outer and inner

**Difficulty:** Medium · **Type:** Packet flow · **Concepts:** encapsulation

A laptop with VPN address `10.8.0.5` at home (public IP `198.51.100.7`) opens a connection to `10.0.2.20:5432` through gateway `203.0.113.50`. Give the source and destination IPs of the inner and outer packets.

<details>
<summary>Answer</summary>

Inner: `10.8.0.5 → 10.0.2.20` (TCP 5432). Outer: `198.51.100.7 → 203.0.113.50` (e.g. UDP to the VPN port) — the source may be the home router's public IP after NAT.

</details>

### P3. Which route wins?

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** split tunnel routing

With split tunnelling the VPN adds `10.0.0.0/8 via vpn0`; the default route `0.0.0.0/0 via 192.168.1.1` stays. Where do packets to `10.0.2.20` and to `142.250.80.46` go?

<details>
<summary>Answer</summary>

`10.0.2.20` matches the /8 (longer than /0) → through the VPN. `142.250.80.46` matches only the default route → directly via the home router.

</details>

### P4. Security limit

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** what VPNs protect

Does a VPN make an HTTP (not HTTPS) website safe to use?

<details>
<summary>Answer</summary>

Only partially: the traffic is encrypted between your device and the VPN endpoint, but from the VPN endpoint to the website it travels as plain HTTP and can be read or altered there. End-to-end protection still requires HTTPS.

</details>
