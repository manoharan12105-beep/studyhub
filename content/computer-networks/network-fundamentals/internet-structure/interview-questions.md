# How the Internet Is Built — Interview Questions

## Beginner

### Q1. Who owns the Internet?

<details>
<summary>Answer</summary>

Nobody owns it as a whole. It is made of independently operated networks (ISPs, carriers, clouds, companies, universities) that agree to exchange traffic. Coordination bodies exist — ICANN/IANA for names and numbers, the IETF for protocol standards, regional registries for IP blocks — but they do not run the networks.

</details>

### Q2. How does data travel between continents?

<details>
<summary>Answer</summary>

Almost entirely through submarine optical fibre cables on the sea floor, which connect to land networks at cable landing stations. Satellites carry a very small share; geostationary satellites add about a quarter of a second of delay each way.

</details>

## Intermediate

### Q3. What is an Internet Exchange Point and why does it exist?

<details>
<summary>Answer</summary>

An IXP is a facility where many networks connect to a shared switching fabric to exchange traffic directly (peering). Without it, traffic between two local ISPs might travel through a distant transit provider; with it, the traffic stays local — lower latency, lower cost and better resilience.

</details>

### Q4. What is the difference between transit and peering?

**Style:** Comparison

<details>
<summary>Answer</summary>

Transit is a paid service: a provider carries your traffic to the whole Internet. Peering is an exchange between two networks of traffic destined for each other's customers, usually settlement-free. Tier 1 networks reach the whole Internet through peering alone.

</details>

## Advanced

### Q5. Why does choosing the cloud region matter for an API's latency?

**Style:** Scenario

<details>
<summary>Answer</summary>

Every request costs at least one round trip, and a new HTTPS connection costs several (TCP handshake, TLS handshake, then the request). Round-trip time is bounded by distance — roughly 1 ms per 100 km of fibre for a round trip — plus routing detours. A server 8,000 km away adds around 80 ms or more per round trip, multiplied by every round trip the client needs. Placing servers (or a CDN edge) near users cuts this directly.

</details>
