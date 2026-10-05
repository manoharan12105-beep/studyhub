# Subnetting Fundamentals — Interview Questions

## Beginner

### Q1. What is subnetting and why is it used?

<details>
<summary>Answer</summary>

Dividing a network into smaller networks by borrowing host bits as network bits (a longer prefix). It reduces broadcast domain size, improves security by separating groups that can be filtered at routers/firewalls, uses address space efficiently (right-sized subnets), and organises routing.

</details>

### Q2. What are the formulas for the number of subnets and hosts?

<details>
<summary>Answer</summary>

Subnets = 2ˢ, where s = borrowed bits (new prefix − original prefix). Usable hosts per subnet = 2ʰ − 2, where h = 32 − new prefix; the two excluded addresses are the network and broadcast addresses.

</details>

## Intermediate

### Q3. You subnet `192.168.1.0/24` into `/26` networks. List them.

**Style:** Output/prediction

<details>
<summary>Answer</summary>

4 subnets of 64 addresses (62 hosts): `192.168.1.0/26` (hosts .1–.62, broadcast .63), `192.168.1.64/26` (.65–.126, .127), `192.168.1.128/26` (.129–.190, .191), `192.168.1.192/26` (.193–.254, .255).

</details>

### Q4. A department needs 120 hosts. Which prefix do you choose, and how many such subnets fit in a /24?

<details>
<summary>Answer</summary>

2ʰ − 2 ≥ 120 → h = 7 (126 hosts) → **/25**. A /24 holds 2^(25−24) = **2** of them.

</details>

## Advanced

### Q5. Why do some textbooks say 2ⁿ − 2 subnets?

**Style:** Follow-up

<details>
<summary>Answer</summary>

Historically the first subnet ("subnet zero") and the last ("all-ones subnet") were avoided because their addresses could be confused with the classful network and broadcast addresses. Modern standards (RFC 1878 and later practice) and equipment allow both, so the number of subnets is 2ⁿ. Use 2ⁿ unless the question explicitly states the old rule.

</details>

### Q6. What is the trade-off when you borrow more bits?

**Style:** Why

<details>
<summary>Answer</summary>

Each borrowed bit doubles the number of subnets but halves each subnet's size, and every subnet loses 2 addresses (network, broadcast) plus usually one for the gateway. Over-subnetting wastes addresses and forces renumbering when a subnet outgrows its size; under-subnetting creates large broadcast domains with weak isolation.

</details>
