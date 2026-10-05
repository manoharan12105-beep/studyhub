# VLSM and Supernetting — Interview Questions

## Beginner

### Q1. What is VLSM?

<details>
<summary>Answer</summary>

Variable Length Subnet Masking: dividing an address block into subnets of different sizes, each with a prefix chosen to fit its host count (e.g. a /25 for 100 hosts and a /30 for a 2-host link). It avoids the waste of giving every subnet the same size.

</details>

### Q2. What is supernetting (route summarisation)?

<details>
<summary>Answer</summary>

Combining several contiguous networks into one shorter prefix that covers them all — e.g. `192.168.16.0/24` to `192.168.19.0/24` summarised as `192.168.16.0/22` — so routers advertise and store one route instead of many.

</details>

## Intermediate

### Q3. Summarise `10.1.4.0/24`, `10.1.5.0/24`, `10.1.6.0/24` and `10.1.7.0/24`.

**Style:** Output/prediction

<details>
<summary>Answer</summary>

Third octets 4–7: `00000100` to `00000111` share the first 6 bits → prefix 16 + 6 = /22. Summary: **`10.1.4.0/22`** (4 is a multiple of the /22 block size 4).

</details>

### Q4. Why are VLSM requirements allocated from largest to smallest?

**Style:** Why

<details>
<summary>Answer</summary>

Each subnet must start at a multiple of its own block size. Placing the largest blocks first keeps every following (smaller) block aligned automatically and leaves the free space contiguous at the end; smallest-first creates gaps and fragmentation that can make a large block impossible to place.

</details>

## Advanced

### Q5. Can `192.168.1.0/24` and `192.168.2.0/24` be summarised as `192.168.1.0/23`?

**Style:** Follow-up

<details>
<summary>Answer</summary>

No. `192.168.1.0/23` is not a valid network: a /23 must start at an even third octet, so the /23 containing `.1` is `192.168.0.0/23` (0–1) and the one containing `.2` is `192.168.2.0/23` (2–3). The smallest single summary for both is `192.168.0.0/22`, which also includes `.0` and `.3` — over-summarisation. Advertise the two /24s instead, unless those extra ranges are unused.

</details>

### Q6. Besides smaller routing tables, why do network engineers summarise routes?

<details>
<summary>Answer</summary>

Stability and speed: when a subnet inside a summary goes up or down, routers outside the summary see no change, so fewer routing updates and recomputations spread through the network; lookups are cheaper and failures stay contained.

</details>
