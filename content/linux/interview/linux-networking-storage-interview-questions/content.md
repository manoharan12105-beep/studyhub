# Networking, Storage and Packages Interview Questions

**Module:** Interview · **Interview priority:** Frequently asked

## What Is It?

An interview bank on the Linux side of networking (IP configuration, DNS tools, ports, `curl`, SSH), storage (disks, partitions, mounting, `df`/`du`, inodes, links), archives and package management. It focuses on the commands an engineer uses on a server, not on network theory. The [questions](interview-questions.md) mix definitions, comparisons and short scenarios.

## Why It Matters

- "Which process listens on port 8080?", "Hard link vs soft link?" and "df vs du?" appear in nearly every Linux interview.
- These commands are the first tools in any connectivity or disk-space incident.

## Core Concept

### How to answer

1. **Name the tool and the exact command** (`ss -ltnp`, `df -h`, `dig +short`).
2. **Explain what the output tells you**, not just the syntax.
3. **For comparisons**, give one sentence per side and when to use each.

### Coverage

| Area | Lessons |
|------|---------|
| Networking | [IP and Hostname](../../networking/ip-and-hostname/content.md), [Connectivity and DNS Tools](../../networking/connectivity-and-dns-tools/content.md), [Ports and HTTP Tools](../../networking/ports-and-http-tools/content.md), [SSH](../../remote-access/ssh-and-remote-access/content.md) |
| Storage | [df and du](../../storage/disk-usage-df-du/content.md), [Partitions and Mounting](../../storage/partitions-and-mounting/content.md), [Inodes and Links](../../storage/inodes-and-links/content.md) |
| Archives and packages | [Archives and Compression](../../archives-and-packages/archives-and-compression/content.md), [Package Management](../../archives-and-packages/package-management/content.md) |

## Key Takeaways

- `ip -br addr`, `ip route`, `ping`, `traceroute`, `dig`/`nslookup`, `ss -ltnp`, `curl -v`; `/etc/hosts`, `/etc/resolv.conf`.
- `df` = filesystem free space; `du` = space used by files; `df -i` = inodes.
- `lsblk`, `blkid`, `mount`, `/etc/fstab` (prefer UUIDs, test with `mount -a`).
- Hard link = another name for the same inode; symlink = a file containing a path.
- `tar -czf`/`-xzf`/`-tzf`; `apt update` refreshes lists, `apt upgrade` installs newer versions.
