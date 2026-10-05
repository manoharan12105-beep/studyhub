# Networking, Storage and Packages Interview Questions — Interview Questions

## Beginner

### Q1. How do you find the IP address of a Linux machine?

<details>
<summary>Answer</summary>

`ip addr` (short form `ip a`, compact `ip -br addr`) shows every interface with its addresses; `hostname -I` prints just the IPs. `ifconfig` is the legacy tool (net-tools), often not installed. The public IP (behind NAT) needs an external service, for example `curl -s ifconfig.me`.

</details>

### Q2. What is the difference between `ping` and `traceroute`?

<details>
<summary>Answer</summary>

`ping` tests whether a host answers ICMP echo requests and measures round-trip time and packet loss. `traceroute` shows each router (hop) on the path to the host, so you can see **where** packets stop or slow down. Both may be blocked by firewalls, so a failure does not prove the host is down.

</details>

### Q3. What is the difference between `df` and `du`?

<details>
<summary>Answer</summary>

`df -h` shows size, used and available space per **mounted filesystem**. `du -sh dir` adds up the space used by **files and directories** you point it at. Use `df` to find which filesystem is full, then `du` to find what fills it.

</details>

### Q4. What is the difference between a hard link and a symbolic link?

<details>
<summary>Answer</summary>

A hard link (`ln target name`) is an additional directory entry for the same inode; all names are equal, the data survives until the last link is deleted, and it cannot cross filesystems or link directories. A symbolic link (`ln -s target name`) is a small file containing a path; it can point anywhere (directories, other filesystems) but breaks ("dangling") if the target is removed or moved.

</details>

### Q5. What is the difference between `apt update` and `apt upgrade`?

<details>
<summary>Answer</summary>

`apt update` downloads the latest package **lists** from the repositories — it installs nothing. `apt upgrade` installs newer versions of installed packages based on those lists (without removing packages; `full-upgrade` may remove or add to resolve dependencies). Run `update` first, then `upgrade`.

</details>

### Q6. How do you create and extract a `.tar.gz` archive?

<details>
<summary>Answer</summary>

Create: `tar -czf backup.tar.gz dir/` (`c` create, `z` gzip, `f` file name). Extract: `tar -xzf backup.tar.gz` (add `-C /target` to choose the directory). List without extracting: `tar -tzf backup.tar.gz`. Modern GNU tar detects compression when extracting, so `tar -xf` works too.

</details>

## Intermediate

### Q7. How do you find which process is listening on a port?

<details>
<summary>Answer</summary>

`sudo ss -ltnp | grep :8080` (`-l` listening, `-t` TCP, `-n` numeric, `-p` process), `sudo lsof -i :8080`, or `sudo fuser 8080/tcp`. `netstat -tulpn` is the legacy equivalent. The local address shows whether it listens on all interfaces (`0.0.0.0`, `*`) or only locally (`127.0.0.1`).

</details>

### Q8. What is the difference between `curl` and `wget`?

<details>
<summary>Answer</summary>

`curl` transfers data with many protocols and is built for **requests**: it prints to stdout by default, supports every HTTP method, headers, request bodies and verbose debugging (`-v`) — ideal for testing APIs. `wget` is built for **downloading**: it saves to a file by default, resumes (`-c`), retries and can mirror websites recursively.

</details>

### Q9. How does Linux resolve a hostname to an IP address?

<details>
<summary>Answer</summary>

The resolver follows `/etc/nsswitch.conf` (`hosts: files dns`): first `/etc/hosts`, then the DNS servers listed in `/etc/resolv.conf` (often `127.0.0.53`, the systemd-resolved stub, which forwards to the real servers shown by `resolvectl status`). `getent hosts name` tests this exact path; `dig`/`nslookup` query DNS directly and ignore `/etc/hosts`.

</details>

### Q10. What is an inode? Can a filesystem run out of them?

<details>
<summary>Answer</summary>

An inode stores a file's metadata — type, permissions, owner, size, timestamps, link count and the location of its data blocks — everything except its name (names live in directories). Ext4 creates a fixed number of inodes when formatting, so millions of tiny files can exhaust them while space remains: "No space left on device" with `df -h` showing free space; `df -i` shows `IUse%` at 100 %.

</details>

### Q11. How do you mount a new disk permanently?

<details>
<summary>Answer</summary>

Identify it (`lsblk`), create a partition and filesystem if new (`fdisk`/`parted`, `mkfs.ext4` — destructive, double-check the device), create a mount point (`mkdir /data`), get the UUID (`blkid`), add a line to `/etc/fstab` (`UUID=… /data ext4 defaults,nofail 0 2`), then test with `sudo mount -a` and `findmnt /data` before rebooting — an fstab error can stop the system from booting normally.

</details>

### Q12. What is the difference between `scp` and `rsync`?

<details>
<summary>Answer</summary>

`scp` copies whole files over SSH every time. `rsync` transfers only differences, preserves attributes with `-a`, can delete extra files at the destination (`--delete`), exclude patterns and run a dry run (`-n`), which makes it the tool for backups, deployments and repeated syncs.

</details>

## Advanced

### Q13. What happens when you delete a file that has two hard links?

<details>
<summary>Answer</summary>

Only that directory entry is removed and the inode's link count drops from 2 to 1. The data remains reachable through the other name. Blocks are freed only when the link count reaches 0 **and** no process has the file open.

</details>

### Q14. Explain the main fields of an `/etc/fstab` line.

<details>
<summary>Answer</summary>

`UUID=3f2a… /data ext4 defaults,noatime,nofail 0 2`: (1) the device — a UUID or label is stable, `/dev/sdb1` can change between boots; (2) the mount point; (3) the filesystem type; (4) mount options (`defaults`, `ro`, `noexec`, `nofail` so boot continues if the disk is missing); (5) dump flag (legacy, 0); (6) fsck order — 1 for root, 2 for others, 0 to skip.

</details>

### Q15. How do you check which package a file belongs to, and which files a package installed?

<details>
<summary>Answer</summary>

On Debian/Ubuntu: `dpkg -S /usr/bin/curl` finds the owning package; `dpkg -L curl` lists the package's files; `apt show curl` shows details; `apt-file search name` finds packages containing a file that is not installed yet. On RHEL: `rpm -qf /usr/bin/curl`, `rpm -ql curl`, `dnf provides '*/name'`.

</details>
