# Network Topologies — Interview Questions

## Beginner

### Q1. What is a network topology? Name the main types.

<details>
<summary>Answer</summary>

The arrangement of nodes and links. Main types: bus (one shared cable), ring (each node linked to two neighbours), star (all nodes linked to a central device), mesh (multiple links between nodes), tree (hierarchy of stars) and hybrid (a mix). Physical topology is the wiring; logical topology is how data flows.

</details>

### Q2. Which topology is most common in modern LANs, and why?

<details>
<summary>Answer</summary>

Star, with a switch or access point at the centre. A broken cable affects only one device, devices are easy to add and troubleshoot, and a switch gives each port dedicated bandwidth. The cost is more cabling and a central device that must be reliable.

</details>

## Intermediate

### Q3. How many links does a full mesh of n devices need?

<details>
<summary>Answer</summary>

n(n − 1)/2 — each of the n devices links to the n − 1 others, and each link is shared by two devices. 5 devices need 10 links; 10 need 45. Each device needs n − 1 ports.

</details>

### Q4. What is the difference between physical and logical topology? Give an example.

**Style:** Comparison

<details>
<summary>Answer</summary>

Physical topology is the actual cabling; logical topology is the path data takes. A hub-based network is physically a star but logically a bus, because the hub repeats every frame to every port so all devices share one collision domain.

</details>

## Advanced

### Q5. Compare star and mesh for a data-centre network.

**Style:** Scenario

<details>
<summary>Answer</summary>

A single star makes the central switch a bottleneck and a single point of failure. Data centres instead use a leaf-spine partial mesh: each rack (leaf) switch connects to every spine switch, so any two servers are the same number of hops apart and traffic can be spread over many equal-cost paths. Losing a spine only reduces capacity.

</details>
