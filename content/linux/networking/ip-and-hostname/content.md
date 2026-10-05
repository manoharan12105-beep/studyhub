# Network Configuration: ip, Routes, Hostname and /etc/hosts

**Module:** Networking Basics · **Interview priority:** Core

## What Is It?

The commands and files that answer "how is this machine connected?":

| Question | Tool |
|----------|------|
| What network interfaces and IP addresses does it have? | `ip addr` (`ip a`) |
| Are the interfaces up? What are their MAC addresses? | `ip link` |
| Where do packets go — what is the default gateway? | `ip route` |
| What is the machine called? | `hostname`, `hostnamectl` |
| Which names resolve without DNS? | `/etc/hosts` |
| Which DNS servers are used? | `/etc/resolv.conf`, `resolvectl` |

`ip` is part of **iproute2**, the modern replacement for `ifconfig`, `route` and `arp` (package `net-tools`, deprecated and often not installed).

> [!NOTE]
> This module stays at the Linux-command level. IP addressing, subnets, routing protocols and DNS internals are covered in depth in the Computer Networks subject.

## Why It Matters

- First step of every connectivity problem: does the machine have the address and route you expect?
- Servers often have several interfaces (public, private, Docker bridges); you need to know which one a service listens on.
- `/etc/hosts` and DNS settings explain "it resolves on my laptop but not on the server".
- Interview questions: how to find the IP address, what the default gateway is, `ifconfig` vs `ip`, what `/etc/hosts` does.

## Core Concept

### Interfaces and addresses

- An **interface** is a network device the kernel can send packets through: `eth0`/`ens33`/`enp0s3` (Ethernet), `wlan0` (Wi-Fi), `lo` (loopback), `docker0` and `veth…` (containers).
- **Loopback** `lo` with `127.0.0.1` (IPv4) and `::1` (IPv6) is the machine talking to itself. A service bound to `127.0.0.1` is **not** reachable from other machines.
- An address is written in **CIDR** notation: `172.19.220.201/20` = the address plus the length of the network prefix. All addresses in the same prefix are on the local network and reached directly; everything else goes via a **gateway**.
- The **MAC address** (`00:15:5d:90:f6:af`) is the hardware address used on the local network segment.

### The routing table

The kernel picks the most specific matching route for every destination:

```text
default via 172.19.208.1 dev eth0                       ← anything not matched below → gateway 172.19.208.1
172.19.208.0/20 dev eth0 scope link src 172.19.220.201  ← local network: deliver directly on eth0
```

No default route = the machine can reach only its local networks ("Network is unreachable" for everything else).

### Name resolution order

When a program looks up a name, glibc follows `/etc/nsswitch.conf` — typically `hosts: files dns`:

1. **files** — `/etc/hosts` (static entries, checked first),
2. **dns** — the servers in `/etc/resolv.conf` (on systemd systems often `127.0.0.53`, the local `systemd-resolved` stub, which forwards to the real servers shown by `resolvectl status`).

That is why an `/etc/hosts` entry overrides DNS — useful for testing, confusing when forgotten.

## Commands

The outputs below come from one machine; your interface names and addresses will differ.

### ip addr: addresses

```bash
ip -br addr
```

**Output (varies):**

```text
lo               UNKNOWN        127.0.0.1/8 10.255.255.254/32 ::1/128
eth0             UP             172.19.220.201/20 fe80::215:5dff:fe90:f6af/64
```

`-br` (brief) gives one line per interface: name, state, addresses. The full form shows more detail:

```bash
ip addr show eth0
```

**Output (varies):**

```text
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1400 qdisc mq state UP group default qlen 1000
    link/ether 00:15:5d:90:f6:af brd ff:ff:ff:ff:ff:ff
    altname enx00155d90f6af
    inet 172.19.220.201/20 brd 172.19.223.255 scope global eth0
       valid_lft forever preferred_lft forever
    inet6 fe80::215:5dff:fe90:f6af/64 scope link proto kernel_ll
       valid_lft forever preferred_lft forever
```

| Part | Meaning |
|------|---------|
| `UP`, `LOWER_UP` | Interface enabled, and a link (cable/virtual link) is present |
| `mtu 1400` | Largest packet size on this link |
| `link/ether` | MAC address |
| `inet` | IPv4 address with prefix length, and broadcast address |
| `inet6 fe80::…` | IPv6 link-local address (only valid on this segment) |

### ip link: interfaces and their state

```bash
ip -br link
```

**Output (varies):**

```text
lo               UNKNOWN        00:00:00:00:00:00 <LOOPBACK,UP,LOWER_UP>
eth0             UP             00:15:5d:90:f6:af <BROADCAST,MULTICAST,UP,LOWER_UP>
```

```bash
# Illustrative: needs root; temporary until reboot
sudo ip link set eth0 down
sudo ip link set eth0 up
```

> [!CAUTION]
> Never take down the interface you are connected through over SSH — the session drops and you may need console access to recover.

### ip route: where packets go

```bash
ip route
```

**Output (varies):**

```text
default via 172.19.208.1 dev eth0 proto kernel
172.19.208.0/20 dev eth0 proto kernel scope link src 172.19.220.201
```

Ask the kernel which route and source address it would use for a destination:

```bash
ip route get 8.8.8.8
```

**Output (varies):**

```text
8.8.8.8 via 172.19.208.1 dev eth0 src 172.19.220.201 uid 1000
    cache
```

Temporary changes (lost on reboot):

```bash
# Illustrative: needs root
sudo ip addr add 192.168.50.10/24 dev eth0
sudo ip route add 10.20.0.0/16 via 192.168.50.1
sudo ip route del 10.20.0.0/16
```

Permanent configuration lives in the distribution's network tool: **netplan** (`/etc/netplan/*.yaml`) on Ubuntu servers, **NetworkManager** (`nmcli`) on desktops and RHEL, or `systemd-networkd`.

### hostname and hostnamectl

```bash
hostname
hostname -I
```

**Output (varies):**

```text
devbox
172.19.220.201
```

`hostname -I` lists all assigned IP addresses (except loopback). `hostnamectl` shows more, and changes the name permanently:

```bash
# Illustrative
hostnamectl
sudo hostnamectl set-hostname web01
```

**Output (varies):**

```text
 Static hostname: devbox
       Icon name: computer-container
         Chassis: container
      Machine ID: 890249b348c44b7ba232e0b72a71012b
  Virtualization: wsl
Operating System: Ubuntu 26.04 LTS
          Kernel: Linux 6.18.33.2-microsoft-standard-WSL2
    Architecture: x86-64
```

After renaming, add the new name to `/etc/hosts` (for `127.0.1.1` on Debian/Ubuntu), or `sudo` may print "unable to resolve host".

### /etc/hosts

```bash
# Illustrative: typical content
cat /etc/hosts
```

**Output (varies):**

```text
127.0.0.1	localhost
127.0.1.1	devbox.localdomain	devbox
```

Add a static entry (for testing a new server before DNS changes, or naming internal hosts):

```bash
# Illustrative: needs root
echo "10.0.0.20  db.internal db" | sudo tee -a /etc/hosts
getent hosts db.internal        # resolves using the same order as applications
```

### DNS configuration

```bash
# Illustrative
cat /etc/resolv.conf
resolvectl status        # systemd-resolved: the real upstream servers
```

`nameserver` lines list DNS servers; `search` lists domains appended to short names. On many systems `/etc/resolv.conf` is generated — edit netplan/NetworkManager settings instead of the file.

## Examples

### "What is my IP address?"

```bash
# Illustrative
ip -br -4 addr              # IPv4 addresses on all interfaces
hostname -I                 # just the addresses
curl -s https://ifconfig.me # your PUBLIC address as seen from the internet (behind NAT it differs)
```

### Diagnose "Network is unreachable"

```bash
# Illustrative
ip -br addr          # 1. does the interface have an address and state UP?
ip route             # 2. is there a default route?
ping -c 2 <gateway>  # 3. can we reach the gateway?
```

## Comparison

### ip (iproute2) vs ifconfig/route (net-tools)

| Task | Modern | Legacy |
|------|--------|--------|
| Show addresses | `ip addr` | `ifconfig` |
| Show interfaces | `ip link` | `ifconfig -a` |
| Show routes | `ip route` | `route -n`, `netstat -rn` |
| Neighbours (ARP) | `ip neigh` | `arp -n` |
| Sockets | `ss` | `netstat` |
| Status | Maintained, installed by default | Deprecated; often not installed |

### /etc/hosts vs DNS

| | `/etc/hosts` | DNS |
|---|---|---|
| Scope | This machine only | Everyone using the DNS server |
| Checked | First (with `hosts: files dns`) | After files |
| Changes | Edit the file, immediate | Update records, wait for TTL/caches |
| Use for | Local overrides, tests, small fixed setups | Everything in production |

## Common Mistakes

- Using `ifconfig` on a modern server and concluding networking is broken because the command is missing.
- Confusing the private address (`hostname -I`) with the public address seen on the internet (NAT).
- Binding a service to `127.0.0.1` and wondering why other machines cannot connect.
- Making routes or addresses with `ip` and expecting them to survive a reboot.
- Leaving a forgotten `/etc/hosts` entry that overrides DNS.
- Editing a generated `/etc/resolv.conf` by hand, only to have it overwritten.

## Key Takeaways

- `ip -br addr` (addresses), `ip -br link` (interfaces), `ip route` (default gateway), `ip route get IP` (route for one destination).
- Loopback `127.0.0.1` is local-only; CIDR `/20` defines the local network; everything else goes via the default gateway.
- `hostname`, `hostname -I`, `hostnamectl set-hostname`.
- Name resolution: `/etc/nsswitch.conf` → `/etc/hosts` → DNS from `/etc/resolv.conf`; test with `getent hosts`.
- `ip` changes are temporary; persistent settings go through netplan, NetworkManager or systemd-networkd.
