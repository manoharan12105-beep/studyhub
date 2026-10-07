# Load-Balancing Algorithms — Interview Questions

## Beginner

### Q1. Name common load-balancing algorithms.

**Style:** Direct

<details>
<summary>Answer</summary>

Round robin, weighted round robin, least connections (and weighted least connections), least response time, IP hash or consistent hashing, geo-based routing, and random with two choices.

</details>

### Q2. Why can round robin be unfair?

**Style:** Why

<details>
<summary>Answer</summary>

It gives every server the same number of new requests regardless of capacity or current load. A small server gets as much work as a large one, and servers stuck with slow or long-lived requests keep receiving new ones.

</details>

## Intermediate

### Q3. When is least connections better than round robin?

**Style:** Comparison

<details>
<summary>Answer</summary>

When connections or requests vary a lot in duration — WebSockets, streaming, file transfers, slow reports. Least connections sends new work to the server with the fewest open connections, so servers busy with long work get less new work. For short, uniform requests on identical servers, round robin is equally good and simpler.

</details>

### Q4. How does weighted round robin distribute traffic with weights 1, 2 and 3?

**Style:** Output/prediction

<details>
<summary>Answer</summary>

In every cycle of 6 requests, the servers receive 1, 2 and 3 requests respectively — shares of about 17 %, 33 % and 50 %. Smooth weighted implementations interleave the picks rather than sending consecutive requests to the heaviest server.

</details>

### Q5. What is IP-hash load balancing used for, and what are its drawbacks?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Hashing the client IP maps each client to a fixed server, giving session affinity without cookies and some cache locality. Drawbacks: clients behind one NAT IP all land on one server, load is uneven when a few clients dominate, and adding or removing servers remaps many clients (consistent hashing reduces this), losing in-memory sessions.

</details>

## Advanced

### Q6. What is "power of two random choices" and why is it used?

**Style:** How

<details>
<summary>Answer</summary>

For each request, pick two servers at random and send the request to the less loaded of the two. It performs nearly as well as checking every server but needs no global view, so it works well with many independent balancers that each have only local or slightly stale load information, avoiding the herd behaviour where all balancers pick the same "least loaded" server.

</details>

### Q7. A newly added server immediately receives a huge share of requests under least connections and its latency spikes. Why, and what fixes it?

**Style:** Debugging

<details>
<summary>Answer</summary>

It starts with zero connections, so least connections sends it almost all new traffic while its caches, connection pools and JIT are still cold. Use slow-start (ramp the new server's weight up over a minute or two) and warm it up before it receives full traffic.

</details>
