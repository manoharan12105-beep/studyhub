# Subnetting Interview Problems

**Module:** Subnetting · **Interview priority:** Core

## What Is It?

A pattern guide for the subnetting questions asked in placement tests and technical interviews: how to **recognise** each question type and which **steps** solve it. The mechanics come from [Subnetting Fundamentals](../subnetting-fundamentals/content.md) and [the Block-Size Method](../subnetting-block-size-method/content.md); the worked [examples](examples.md) and [practice](practice.md) go from easy to hard.

## Why It Matters

Subnetting is one of the few networking topics with a single correct numeric answer, so it is a favourite for written tests and for "solve this on the whiteboard" rounds. Every question is one of a handful of types; recognising the type is half the work.

## Core Concept

### Question types and their recipe

| # | The question says… | Recipe |
|---|--------------------|--------|
| 1 | "Find the network / broadcast / host range of `IP/n`" | Interesting octet → block size → round down → next block − 1 |
| 2 | "How many hosts / subnets?" | Hosts = 2^(32−n) − 2; subnets = 2^(new − old) |
| 3 | "Which mask/prefix for H hosts?" | Smallest h with 2ʰ − 2 ≥ H; prefix = 32 − h |
| 4 | "Divide network X into N subnets" | Smallest s with 2ˢ ≥ N; prefix = old + s; list blocks |
| 5 | "Is this address a valid host?" | Find its network and broadcast; valid if strictly between |
| 6 | "Are A and B in the same subnet?" | Compute both network addresses; equal → same |
| 7 | "What is the k-th subnet / last host of the k-th subnet?" | Start = (k − 1) × block (counting from 1) |
| 8 | "Is this configuration correct?" (IP, mask, gateway) | Gateway must be a host in the same subnet as the IP |
| 9 | "Allocate subnets for these departments" | VLSM: largest first, align to block size |
| 10 | "Summarise these routes" | Count common leading bits |

### A five-line checklist for any address question

```text
1. Prefix → interesting octet (/8–15: 2nd, /16–23: 3rd, /24–30: 4th)
2. Mask value in that octet → block size = 256 − mask
3. Network: round that octet down to a multiple of the block; right octets → 0
4. Broadcast: next multiple − 1; right octets → 255
5. Hosts: network + 1 … broadcast − 1; count = 2^(32−n) − 2
```

### Mental shortcuts

- `/24` and above: only the last octet changes — quickest case.
- Host count from mask value: `256 − mask` addresses in the interesting octet; multiply by 256 for each octet to the right.
- The last host of any subnet ends in an **even** number in the 4th octet for /24–/30 (broadcast is odd).
- Every network address is a multiple of its block size; every broadcast is one less than a multiple.

## Common Mistakes

- Working in the wrong octet (most common error for /17–/23 questions).
- Counting the first subnet as k = 0 when the question counts from 1, or the reverse — read carefully.
- Forgetting −2 for hosts, or wrongly applying −2 to subnets.
- Calling `x.x.x.0` or `x.x.x.255` invalid inside a /23 or /22 — they can be ordinary hosts.
- Picking a gateway that is the network or broadcast address, or in another subnet.

## Key Takeaways

- Identify the type, then apply its recipe.
- Interesting octet + block size solves every address question.
- Validity, same-subnet and configuration questions all reduce to computing network addresses.
