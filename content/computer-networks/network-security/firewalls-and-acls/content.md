# Firewalls and Access Control Lists

**Module:** Network Security · **Interview priority:** Core

## What Is It?

A **firewall** allows or blocks network traffic according to **rules**. An **ACL** (access control list) is an ordered list of such rules, applied on a router interface, firewall or cloud network. Each rule matches packet fields — source/destination IP, protocol, port, direction, connection state — and says **allow** or **deny**.

## Why It Exists

Not every host should be reachable by everyone: a database should accept connections only from its application servers, SSH only from administrators, and the Internet only port 443 on the load balancer. Firewalls enforce **who may talk to what** at the network level, shrinking the attack surface.

## How It Works

### Rule evaluation

```text
#  Action  Proto  Source           Destination       Port
1  allow   tcp    any              10.0.1.0/24       443      ← public HTTPS to the web tier
2  allow   tcp    10.0.1.0/24      10.0.2.20         5432     ← web tier to PostgreSQL
3  allow   tcp    10.0.9.0/24      10.0.0.0/16       22       ← admins (VPN subnet) to SSH
4  deny    any    any              any               any      ← default deny (often implicit)
```

- Rules are checked **top to bottom**; the **first match wins** (on classic ACLs and most firewalls).
- Order matters: a broad `allow any` above a specific `deny` makes the deny useless.
- Most firewalls end with an **implicit deny**: anything not allowed is dropped.

### Stateless vs stateful firewalls

| | Stateless (packet filter) | Stateful |
|---|---------------------------|----------|
| Decides on | Each packet alone (header fields) | Packets **in the context of connections** |
| Return traffic | Needs explicit rules for replies (e.g. allow inbound from port 443 to ephemeral ports 1024–65535) | Replies to allowed connections are allowed automatically |
| Tracks | Nothing | A **connection table**: 5-tuple + TCP state |
| Strength | Simple, fast | Safer, easier rules; blocks packets that do not belong to a real connection |
| Examples | Router ACLs, AWS **network ACLs** | Linux iptables/nftables with conntrack, AWS **security groups**, most firewall appliances |

Example — a web server allowing inbound HTTPS:

```text
Stateless: inbound  allow tcp any → server:443
           outbound allow tcp server:443 → any:1024-65535   (must allow the replies explicitly)
Stateful:  inbound  allow tcp any → server:443               (replies tracked and allowed automatically)
```

### Drop vs reject

| Action | What the sender sees | Trade-off |
|--------|----------------------|-----------|
| **Drop** (deny silently) | Nothing → **connection timed out** | Gives scanners less information; slower failures for legitimate clients |
| **Reject** | TCP RST or ICMP unreachable → **connection refused** / unreachable immediately | Fast, clear failures |

This explains the difference between [refused and timeout](../../troubleshooting/troubleshooting-connection-errors/content.md) errors.

### Kinds of firewalls

| Kind | Works at | Notes |
|------|----------|-------|
| Packet filter / ACL | L3–L4 | IPs, ports, protocols |
| Stateful firewall | L3–L4 + connection state | Standard today |
| Next-generation firewall (NGFW) | Up to L7 | Identifies applications, users, threats (IPS) |
| **WAF** (web application firewall) | L7 (HTTP) | Blocks SQL injection, XSS patterns, bad bots; in front of web apps |
| **Host firewall** | One machine | `ufw`, `firewalld`, `nftables`, Windows Defender Firewall |
| **Cloud security groups / NSGs** | Per instance or interface | Stateful, allow-only rules, can reference other security groups |

### Where firewalls sit

```text
Internet ──► [edge firewall / WAF] ──► DMZ: load balancer, reverse proxy
                                    ──► [internal firewall] ──► app servers ──► [firewall] ──► databases
```

A **DMZ** (demilitarised zone) holds Internet-facing services so that a compromise there does not give direct access to the internal network.

## Real World

- **AWS:** security groups (stateful, attached to instances, allow rules only) + network ACLs (stateless, per subnet, allow and deny, numbered order). A classic bug: the NACL allows inbound 443 but not the outbound ephemeral ports, so replies are dropped.
- Best practice: let the database security group allow 5432 **from the app's security group** rather than from IP ranges — it follows instances as they scale.
- A host firewall on a Linux VM (`ufw allow 22/tcp`, `ufw allow 443/tcp`) adds a second layer.

## Common Traps

- **"A stateless firewall automatically allows replies."** Only stateful ones do.
- **"Rule order does not matter."** First match wins; put specific rules before general ones.
- **"A firewall stops all attacks."** It controls reachability; allowed traffic (e.g. HTTPS to your API) can still carry attacks — that is what WAFs and secure code are for.
- **"Blocking ping makes the server invisible."** Port scans still find open TCP ports.

## Interview Follow-up

- *"Stateful vs stateless firewall?"* Connection tracking vs per-packet decisions — see the table.
- *"Why does a connection time out instead of being refused?"* A firewall is silently dropping it.

## Key Takeaways

- Firewalls/ACLs filter by IP, protocol, port, direction and state; rules are ordered, first match wins, default deny.
- Stateless filters judge each packet and need explicit return rules; stateful firewalls track connections.
- Drop → timeout; reject → refused/unreachable.
- Types: packet filters, stateful, NGFW, WAF (L7), host firewalls, cloud security groups (stateful) and NACLs (stateless).
