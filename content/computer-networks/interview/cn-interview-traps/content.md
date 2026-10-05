# Computer Networks Interview Traps

**Module:** Interview Preparation · **Interview priority:** Core

## What Is It?

A collection of statements that **sound right but are wrong** — the misconceptions interviewers deliberately probe. Each [question](interview-questions.md) states the trap, gives the precise truth, and points to the lesson that proves it.

## Why It Matters

Traps separate memorised definitions from understanding. Many are also real production mistakes: blocking all ICMP, trusting `X-Forwarded-For` from anyone, disabling TIME_WAIT, believing NAT is a firewall.

## Core Concept

### How to answer a trap question

1. **Do not agree quickly.** Words like "always", "never", "just", "same" signal a trap.
2. **State the precise rule** ("a switch separates *collision* domains").
3. **Give the counter-example or mechanism** ("broadcasts are flooded to all ports in the VLAN").
4. **Add the practical consequence** ("so you need VLANs or routers to limit broadcasts").

### Coverage

The traps span every module: devices and domains, addressing, ARP, routing, TCP/UDP, HTTP, TLS, DNS, NAT, security and performance. The revision mode's *Traps and Misconceptions* sheet summarises them for last-minute review.

## Key Takeaways

- Precise vocabulary wins: collision vs broadcast domain, authentication vs authorization, flow vs congestion control.
- Most traps are about **which layer** does something and **what changes** at each hop.
- Always explain the consequence, not just the correction.
