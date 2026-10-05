# Longest Prefix Match — Interview Questions

## Beginner

### Q1. What is longest prefix match?

<details>
<summary>Answer</summary>

The rule routers use when a destination matches several routes: choose the route with the longest (most specific) prefix. For `10.1.2.77`, a `10.1.2.0/24` route beats `10.1.0.0/16`, which beats `10.0.0.0/8`, which beats the default `0.0.0.0/0`.

</details>

## Intermediate

### Q2. Which route is chosen for `172.16.5.130`? Table: `172.16.0.0/16 via A`, `172.16.5.0/24 via B`, `172.16.5.128/25 via C`, `0.0.0.0/0 via D`.

**Style:** Output/prediction

<details>
<summary>Answer</summary>

All four match (`/25` covers `.128`–`.255`). The longest is **/25 → via C**.

</details>

### Q3. A `/24` route has metric 100 and a `/16` route covering the same destination has metric 1. Which is used?

**Style:** Follow-up

<details>
<summary>Answer</summary>

The `/24`. Prefix length is compared first; metric only breaks ties between routes for the same prefix (from the same protocol), and administrative distance between routes for the same prefix from different sources.

</details>

## Advanced

### Q4. Why does a full-tunnel VPN install `0.0.0.0/1` and `128.0.0.0/1` instead of replacing the default route?

**Style:** Why

<details>
<summary>Answer</summary>

Together the two /1 routes cover the whole IPv4 space and, being longer than /0, win every lookup over the existing default route — so all traffic goes into the tunnel without deleting the original default route. When the VPN disconnects, removing the two /1s restores normal routing instantly. The route to the VPN server itself is a /32 via the original gateway, which beats the /1s.

</details>

### Q5. How can announcing a more specific prefix hijack traffic on the Internet?

**Style:** Scenario

<details>
<summary>Answer</summary>

Routers everywhere prefer the longest matching prefix. If an attacker (or a misconfigured network) announces `203.0.113.0/24` via BGP while the real owner announces `203.0.112.0/22`, routers that accept the /24 send traffic for that /24 to the attacker. Defences include RPKI route origin validation and prefix filtering by ISPs.

</details>
