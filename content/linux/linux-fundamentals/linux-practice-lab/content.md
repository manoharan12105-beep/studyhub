# Linux Practice Lab

**Module:** Linux Fundamentals · **Interview priority:** Awareness

## What Is It?

The practice lab is one folder, `~/linux-lab`, filled with small sample files: an application log, a web server access log, a CSV of employees, a Java project and a few configuration files. Every runnable example in the Linux topics assumes you are inside this folder.

Running the setup script below creates it. It touches nothing outside `~/linux-lab`, needs no `sudo`, and can be deleted and recreated at any time.

## Why It Matters

- Commands are learned by typing them. Reading about `grep` is not the same as watching it filter a real log.
- With identical files, your output matches the output printed in the lessons, so you can tell immediately whether you understood a command.
- A throwaway folder is a safe place to practise commands that delete, move or change permissions — never practise those on files you care about.

## Core Concept

### Where to practise

| Option | How | Notes |
|--------|-----|-------|
| WSL (Windows) | `wsl --install` in an administrator PowerShell, then open **Ubuntu** | Real Linux kernel; easiest on Windows |
| Virtual machine | VirtualBox or VMware with an Ubuntu ISO | Full system, including services and disks |
| Docker container | `docker run -it --rm ubuntu bash` | Disposable; minimal image, install tools with `apt` |
| Cloud VM | A free-tier Ubuntu instance, reached with `ssh` | Closest to a real server |
| macOS Terminal | Built in | Uses BSD versions of many tools — options and output differ from GNU/Linux |

> [!CAUTION]
> Never practise destructive commands (`rm -r`, `chmod -R`, `chown -R`, `dd`, `mkfs`, `kill`) on a production server, a shared machine or your own important files. Use the lab, a VM or a container.

### Conventions used in every Linux topic

- Commands are shown in `bash` blocks **without** a prompt, so you can copy them. The output follows under **Output:**.
- Every example starts in `~/linux-lab` unless it says otherwise. Examples within one page build on each other in order.
- Outputs were produced with **GNU coreutils** on Ubuntu with the `C.UTF-8` locale. Your output can differ in a few predictable ways:
  - your **username** appears where the lessons show `student`, and your machine name where they show `devbox`;
  - **dates and times** in `ls -l` reflect when you ran the setup;
  - inode numbers, process IDs, IP addresses and sizes of system disks are specific to your machine — those outputs are marked **Output (varies):**.
- A block that starts with `# Illustrative` shows a command form, needs root, changes the system, or depends on the network. Read it; run it only on a machine where that is safe.

> [!NOTE]
> Ubuntu 25.10 and later install the Rust re-implementation of coreutils (uutils) by default. It aims to behave like GNU coreutils, but some error messages and spacing differ. The GNU versions stay available with a `gnu` prefix (`gnuls`, `gnusort`, …).

## Setup Script

Paste the whole block into a terminal. It creates `~/linux-lab` and the files listed in the next section.

```bash
mkdir -p ~/linux-lab && cd ~/linux-lab
mkdir -p config project/src project/test project/docs logs/archive

cat > app.log <<'EOF'
2026-01-15 09:00:01 INFO  [main] Application starting
2026-01-15 09:00:02 INFO  [main] Loading configuration from config/app.conf
2026-01-15 09:00:03 WARN  [db] Connection pool size not set, using default 10
2026-01-15 09:00:05 INFO  [http] Server listening on port 8080
2026-01-15 09:15:42 ERROR [db] Connection timed out after 30s
2026-01-15 09:15:43 INFO  [db] Retrying connection (attempt 2)
2026-01-15 09:15:44 INFO  [db] Connection established
2026-01-15 10:02:10 WARN  [http] Slow request: GET /api/orders took 2300ms
2026-01-15 10:30:00 ERROR [payment] Payment gateway returned 503
2026-01-15 10:30:01 ERROR [payment] Order 1042 payment failed
2026-01-15 11:45:12 INFO  [http] GET /api/health 200
2026-01-15 12:00:00 INFO  [main] Scheduled cleanup finished
EOF

cat > access.log <<'EOF'
192.168.1.10 - - [15/Jan/2026:09:00:01 +0000] "GET /index.html HTTP/1.1" 200 1043
192.168.1.11 - - [15/Jan/2026:09:00:05 +0000] "GET /login HTTP/1.1" 200 512
192.168.1.10 - - [15/Jan/2026:09:01:12 +0000] "POST /login HTTP/1.1" 302 0
10.0.0.5 - - [15/Jan/2026:09:02:30 +0000] "GET /api/orders HTTP/1.1" 200 2310
192.168.1.12 - - [15/Jan/2026:09:03:44 +0000] "GET /missing.html HTTP/1.1" 404 154
10.0.0.5 - - [15/Jan/2026:09:04:01 +0000] "GET /api/orders/42 HTTP/1.1" 500 87
192.168.1.10 - - [15/Jan/2026:09:05:19 +0000] "GET /dashboard HTTP/1.1" 200 3150
10.0.0.5 - - [15/Jan/2026:09:06:00 +0000] "GET /api/orders HTTP/1.1" 200 2290
192.168.1.11 - - [15/Jan/2026:09:07:23 +0000] "GET /favicon.ico HTTP/1.1" 404 154
192.168.1.10 - - [15/Jan/2026:09:08:45 +0000] "GET /logout HTTP/1.1" 200 98
EOF

cat > employees.csv <<'EOF'
id,name,dept,salary,city
101,asha,engineering,85000,chennai
102,ravi,sales,52000,mumbai
103,meena,engineering,92000,bengaluru
104,john,hr,48000,chennai
105,fatima,sales,61000,delhi
106,arjun,engineering,78000,mumbai
107,divya,hr,50000,bengaluru
108,karan,sales,45000,chennai
EOF

printf '%s\n' banana apple cherry apple banana mango apple > fruits.txt
printf '%s\n' 10 2 33 4 100 25 > numbers.txt
printf '%s\n' apple banana cherry mango > list1.txt
printf '%s\n' banana grape mango orange > list2.txt

cat > notes.txt <<'EOF'
Linux is a kernel.
GNU tools run on linux.
The shell reads commands.
Bash is a popular shell.
linux distributions bundle the kernel with software.
EOF

printf '%s\n' server.port=8080 server.host=localhost log.level=INFO cache.enabled=false > v1.txt
printf '%s\n' server.port=9090 server.host=localhost log.level=DEBUG cache.enabled=false metrics.enabled=true > v2.txt

cat > config/app.conf <<'EOF'
# Application configuration
app.name=inventory
app.port=8080
app.env=dev
db.host=localhost
db.port=5432
log.level=INFO
EOF
printf '%s\n' 'db.user=inventory' 'db.password=change-me' > config/db.conf

printf '%s\n' '# Inventory Service' 'A small Java project used in the Linux lab.' > project/readme.md
printf '%s\n' '#!/bin/bash' 'echo "Building inventory..."' 'echo "Build finished"' > project/build.sh
printf '%s\n' 'target/' '*.class' > project/.gitignore
printf '%s\n' '# Design notes' > project/docs/design.md
for c in Main Order OrderService PaymentService; do
  printf 'public class %s {\n    // TODO: implement\n}\n' "$c" > "project/src/$c.java"
done
printf 'public class OrderServiceTest {\n}\n' > project/test/OrderServiceTest.java

printf '2026-01-01 INFO  nightly job ok\n' > logs/app-2026-01-01.log
printf '2026-01-08 INFO  nightly job ok\n2026-01-08 ERROR nightly job failed\n' > logs/app-2026-01-08.log
printf '2026-01-14 INFO  nightly job ok\n' > logs/app-2026-01-14.log
yes '2026-01-15 09:00:00 DEBUG [cache] cache refresh tick' | head -c 3145728 > logs/debug.log
gzip -c logs/app-2026-01-01.log > logs/archive/app-2025-12-01.log.gz
touch -d '30 days ago' logs/archive/app-2025-12-01.log.gz
touch -d '20 days ago' logs/app-2026-01-01.log
touch -d '10 days ago' logs/app-2026-01-08.log
touch -d '2 days ago' logs/app-2026-01-14.log

chmod -R u=rwX,go=rX ~/linux-lab
chmod 600 config/db.conf
echo "Lab ready in $PWD"
```

To start over, leave the folder and recreate it:

```bash
# Illustrative: reset the lab (deletes only ~/linux-lab)
cd ~ && rm -r ~/linux-lab
# then paste the setup script again
```

## Lab Contents

```text
~/linux-lab/
├── access.log          10 web requests: IP, time, method, path, status, bytes
├── app.log             12 application log lines: INFO, WARN, ERROR
├── employees.csv       header + 8 employees: id,name,dept,salary,city
├── fruits.txt          7 unsorted fruit names with duplicates
├── numbers.txt         10 2 33 4 100 25 — one per line
├── list1.txt           apple banana cherry mango (sorted)
├── list2.txt           banana grape mango orange (sorted)
├── notes.txt           5 sentences mentioning Linux in different cases
├── v1.txt, v2.txt      two versions of a small config, for diff
├── config/
│   ├── app.conf        key=value settings with a comment line
│   └── db.conf         credentials, permissions 600 (owner only)
├── logs/
│   ├── app-2026-01-01.log   modified 20 days ago
│   ├── app-2026-01-08.log   modified 10 days ago, contains an ERROR
│   ├── app-2026-01-14.log   modified 2 days ago
│   ├── debug.log            3 MiB of repeated DEBUG lines (the "large file")
│   └── archive/app-2025-12-01.log.gz   compressed, modified 30 days ago
└── project/
    ├── .gitignore      hidden file
    ├── build.sh        a script WITHOUT execute permission
    ├── readme.md
    ├── docs/design.md
    ├── src/            Main.java Order.java OrderService.java PaymentService.java
    └── test/           OrderServiceTest.java
```

Permissions after setup: files `rw-r--r--` (644), directories `rwxr-xr-x` (755), and `config/db.conf` `rw-------` (600).

## Common Mistakes

- Running the examples from another directory. Most use relative paths such as `app.log`, so run `cd ~/linux-lab` first.
- Copying only part of the setup script. Paste all of it; it is safe to run again (it overwrites the sample files).
- Comparing outputs that are marked **(varies)** character by character. Check the shape of the output instead.

## Key Takeaways

- Everything runnable in the Linux topics happens in `~/linux-lab`, created by one safe script.
- Use WSL, a VM, a container or a cloud VM — never production — for practice.
- Usernames, dates, PIDs, inodes and IP addresses in your output will differ; everything else should match.
