# Network Troubleshooting Methodology

**Module:** Troubleshooting · **Interview priority:** Core

## What Is It?

A systematic way to find network faults instead of guessing: define the problem, test **layer by layer**, change one thing at a time, and confirm the fix. Interviewers ask "How would you troubleshoot no internet?" mainly to hear this structure.

## Why It Exists

Network symptoms are vague ("the site is down", "it's slow"), and many layers and devices can cause them. Random fixes (rebooting, reinstalling) waste time and destroy evidence. A layered method narrows the problem quickly because **each layer depends on the ones below**: if Layer 3 fails, nothing above it can work.

## How It Works

### The general process

1. **Define the problem precisely.** What fails (one site, all sites, one app)? For whom (one user, a floor, everyone)? Since when? What changed (deploy, config, network change)? Error message exactly?
2. **Gather information.** Configuration (`ipconfig /all`, `ip addr`, `ip route`, DNS settings), logs, monitoring.
3. **Form a hypothesis and test it** with the least invasive check.
4. **Narrow down** using the layer approach below.
5. **Fix**, preferring the least disruptive change; change one thing at a time.
6. **Verify** the fix from the user's point of view.
7. **Document and prevent** (monitoring, automation, root cause).

### The layered (OSI) approach

| Layer | Question | Quick checks |
|-------|----------|--------------|
| 1 Physical | Is there a link? | Cable/link light, Wi-Fi connected, interface `UP`? |
| 2 Data Link | Can I reach my LAN? | Interface has a MAC; ARP entry for the gateway (`arp -a`, `ip neigh`) |
| 3 Network | Do I have a valid IP, and can I reach the gateway and beyond? | IP/mask/gateway correct (not `169.254.x.x`); `ping gateway`; `ping 8.8.8.8`; `traceroute` |
| — DNS | Do names resolve? | `nslookup example.com`; try another resolver |
| 4 Transport | Is the port reachable? | `nc -zv host 443`, `Test-NetConnection -Port`; refused vs timeout |
| 5–6 Session/TLS | Does the TLS handshake succeed? | `curl -v`: certificate errors, protocol mismatch |
| 7 Application | Does the service answer correctly? | HTTP status (`curl -I`), application logs |

### Three strategies

| Strategy | Start at | Best when |
|----------|----------|-----------|
| **Bottom-up** | Layer 1 | Nothing works; new setups; physical changes |
| **Top-down** | Layer 7 | One application fails while others work |
| **Divide and conquer** | The middle — usually `ping` (Layer 3) | Experienced first guess: success → look up the stack; failure → look down |

### The "follow the path" view

Combine layers with the **path**: client → local network → gateway → ISP/Internet → server's network → server → application → dependencies (database). Test each segment: `ping` the gateway, then an Internet IP, then the server; `traceroute` shows where packets stop.

### Decision tree: "the internet is not working"

```text
Is the interface connected (cable/Wi-Fi)?            no → Layer 1: cable, Wi-Fi, adapter
            │ yes
Valid IP? (not 169.254.x.x, right subnet)             no → DHCP problem: server, VLAN, pool
            │ yes
ping default gateway works?                           no → LAN: wrong gateway/mask, switch, ARP
            │ yes
ping 8.8.8.8 works?                                   no → beyond the gateway: router/ISP/NAT/firewall
            │ yes                                           (traceroute to see where it stops)
nslookup google.com works?                            no → DNS: resolver settings/reachability
            │ yes
curl -v https://site works?                           no → port/firewall/TLS/proxy/that site
            │ yes
Problem is in the application or the specific site
```

## Real World

- In production, start with **scope**: one user vs one region vs everyone; recent deployments; dashboards — before logging into any server.
- Keep evidence: capture `ip addr`, `ip route`, `ss`, logs and packet captures before restarting.
- Typical backend split: "Can my service reach the database?" → DNS (`getent hosts db`) → TCP (`nc -zv db 5432`) → TLS/auth (driver error message) → query (DB logs).

## Common Traps

- **Skipping the definition step** — "the network is slow" often turns out to be one overloaded API.
- **Trusting ping alone** — ICMP may be blocked while TCP works, or allowed while the port is filtered.
- **Changing several things at once** — you never learn what fixed it.
- **Restarting first** — it may hide the problem and erase evidence.

## Interview Follow-up

- *"How would you troubleshoot 'internet not working'?"* Walk the decision tree above, naming a command for each step.
- *"Why bottom-up?"* Each layer depends on the layers below; the first failing layer is where the problem is.

## Key Takeaways

- Define → gather → hypothesise and test → narrow → fix → verify → document.
- Test layer by layer: link, IP config, gateway, Internet by IP, DNS, port, TLS, application.
- Bottom-up for total failures, top-down for single-application failures, divide and conquer from `ping`.
- Change one thing at a time; keep evidence.
