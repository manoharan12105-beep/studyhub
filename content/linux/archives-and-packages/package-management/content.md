# Package Management with apt

**Module:** Archives and Package Management · **Interview priority:** Core

## What Is It?

A **package** is an archive containing a program's files plus metadata: name, version, description, the list of other packages it needs (**dependencies**), and scripts to run on install or removal. A **package manager** downloads packages from **repositories** (trusted servers), resolves dependencies, installs files into the right places, and tracks every installed file so it can upgrade or remove them cleanly.

On Debian and Ubuntu the layers are:

| Layer | Tool | Works with |
|-------|------|-----------|
| High level | `apt` (interactive), `apt-get` / `apt-cache` (scripts) | Repositories, dependency resolution, downloads |
| Low level | `dpkg` | Individual `.deb` files already on disk; the database of installed packages |

## Why It Matters

- Installing and patching software on servers (`nginx`, `postgresql`, `openjdk-21-jdk`) is done with the package manager — never by copying binaries around.
- Security updates arrive as package upgrades; keeping servers patched is a core operations task.
- Dockerfiles are full of `apt-get` lines; writing them correctly keeps images small and reproducible.
- Interview favourite: "`apt update` vs `apt upgrade`".

## Core Concept

### Repositories and the package index

```text
repository (archive.ubuntu.com, security.ubuntu.com, vendor repos)
      │   apt update  → downloads the LIST of available packages and versions
      ▼
local package index (/var/lib/apt/lists/)
      │   apt install / apt upgrade  → chooses versions, resolves dependencies
      ▼
downloaded .deb files (/var/cache/apt/archives/)
      │   dpkg unpacks files, runs install scripts
      ▼
installed packages (database in /var/lib/dpkg/)
```

- Repositories are configured in `/etc/apt/sources.list` and `/etc/apt/sources.list.d/` (newer Ubuntu releases use the `*.sources` format there).
- Packages are **signed**; apt verifies signatures with trusted keys, so a tampered package is rejected.
- `apt update` changes **no installed software** — it only refreshes the list of what is available.

### Dependencies

`apt install curl` also installs the libraries `curl` needs (`libcurl4t64`, …) if they are missing. Removing a package leaves dependencies that are no longer needed; `apt autoremove` cleans them up. A **broken dependency** ("held broken packages", "unmet dependencies") means the requested versions cannot all be satisfied — usually from mixing repositories or installing a `.deb` built for another release.

## Commands

### Everyday apt commands

| Command | Does |
|---------|------|
| `sudo apt update` | Refresh the package index from the repositories |
| `sudo apt upgrade` | Upgrade all installed packages to the newest candidate versions (never removes packages) |
| `sudo apt full-upgrade` | Upgrade, adding or **removing** packages if needed to resolve changes |
| `sudo apt install nginx` | Install a package and its dependencies |
| `sudo apt install ./app_1.2_amd64.deb` | Install a local `.deb` file, resolving its dependencies from the repositories |
| `sudo apt remove nginx` | Remove the package, **keep** its configuration files |
| `sudo apt purge nginx` | Remove the package **and** its configuration files |
| `sudo apt autoremove` | Remove dependencies nothing needs any more |
| `apt search keyword` | Search names and descriptions |
| `apt show nginx` | Package details: version, size, dependencies, description |
| `apt list --installed` / `--upgradable` | List packages |
| `sudo apt clean` | Delete downloaded `.deb` files from the cache (frees disk space) |

```bash
# Illustrative: needs root and network access
sudo apt update
sudo apt install -y htop
htop --version
sudo apt remove htop
```

`-y` answers "yes" to the confirmation prompt — useful in scripts and Dockerfiles.

### Which version is installed, and which would be installed?

```bash
# Illustrative
apt-cache policy curl
```

**Output (varies):**

```text
curl:
  Installed: 8.18.0-1ubuntu2.4
  Candidate: 8.18.0-1ubuntu2.5
  Version table:
     8.18.0-1ubuntu2.5 500
        500 http://archive.ubuntu.com/ubuntu resolute-updates/main amd64 Packages
```

**Installed** is the current version; **Candidate** is what `apt upgrade` would install. When they differ, an update is pending.

```bash
# Illustrative
apt list --upgradable
```

**Output (varies):**

```text
Listing...
apparmor/resolute-updates 5.0.2-0ubuntu1~26.04.1 amd64 [upgradable from: 5.0.0~beta1-0ubuntu7]
apport/resolute-updates 2.34.1-0ubuntu0.1 all [upgradable from: 2.34.0-0ubuntu2]
```

### Dependencies of a package

```bash
# Illustrative
apt-cache depends curl | head -n 5
```

**Output (varies):**

```text
curl
  Depends: libcurl4t64
  Depends: libc6
  Depends: zlib1g
  Recommends: bash-completion
```

**Recommends** are installed by default too (skip them with `--no-install-recommends`, common in Docker images).

### dpkg: the low-level view

| Command | Does |
|---------|------|
| `dpkg -l [pattern]` | List installed packages (`ii` = installed) |
| `dpkg -L package` | List the files a package installed |
| `dpkg -S /path/to/file` | Which package owns this file? |
| `dpkg -s package` | Status and details of an installed package |
| `sudo dpkg -i file.deb` | Install a local `.deb` (does **not** fetch missing dependencies) |

```bash
# Illustrative: read-only queries
dpkg -S /usr/bin/bash
dpkg -l bash curl | tail -n 2
dpkg -L curl | head -n 4
```

**Output (varies):**

```text
bash: /usr/bin/bash
ii  bash           5.3-2ubuntu1      amd64        GNU Bourne Again SHell
ii  curl           8.18.0-1ubuntu2.4 amd64        command line tool for transferring data with URL syntax
/.
/usr
/usr/bin
/usr/bin/curl
```

If `dpkg -i` stops with missing dependencies, `sudo apt -f install` ("fix broken") fetches them and completes the installation — or use `sudo apt install ./file.deb` from the start.

### Adding a third-party repository (overview)

```bash
# Illustrative: the general pattern used by vendors (Docker, PostgreSQL, Node…)
curl -fsSL https://vendor.example/key.gpg | sudo gpg --dearmor -o /etc/apt/keyrings/vendor.gpg
echo "deb [signed-by=/etc/apt/keyrings/vendor.gpg] https://vendor.example/apt stable main" \
  | sudo tee /etc/apt/sources.list.d/vendor.list
sudo apt update
sudo apt install vendor-package
```

Only add repositories you trust: their packages run install scripts as root.

## Examples

### A Dockerfile-friendly install

```bash
# Illustrative: inside a Dockerfile RUN instruction
apt-get update \
 && apt-get install -y --no-install-recommends curl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
```

`apt-get` (stable output for scripts), update and install in the **same** layer (so the index is never stale), no recommends, and the index deleted to keep the image small.

### Patch a server

```bash
# Illustrative
sudo apt update
apt list --upgradable
sudo apt upgrade
[ -f /var/run/reboot-required ] && echo "reboot needed (kernel or core library updated)"
```

Unattended security updates (`unattended-upgrades`) automate this on Ubuntu.

### Free disk space taken by packages

```bash
# Illustrative
sudo apt clean          # downloaded .deb files in /var/cache/apt/archives
sudo apt autoremove     # unused dependencies and old kernels
```

## Comparison

### apt update vs apt upgrade vs apt full-upgrade

| | `apt update` | `apt upgrade` | `apt full-upgrade` |
|---|---|---|---|
| Changes installed software | No | Yes | Yes |
| Downloads | Package lists | Packages | Packages |
| May install new dependencies | — | Yes | Yes |
| May remove packages | — | No | Yes, if required |
| Run order | First | After `update` | After `update` (major changes) |

### apt vs apt-get vs dpkg

| | `apt` | `apt-get` / `apt-cache` | `dpkg` |
|---|---|---|---|
| Audience | Humans (progress bar, colours) | Scripts (stable interface) | Low level |
| Resolves dependencies | Yes | Yes | No |
| Uses repositories | Yes | Yes | No — local `.deb` files only |

### remove vs purge

| | `apt remove` | `apt purge` |
|---|---|---|
| Program files | Removed | Removed |
| Config files in `/etc` | Kept (reinstall restores your settings) | Removed |
| Data in `/var/lib` | Usually kept | Often kept too — check before assuming data is gone |

### Package managers on other distributions

| Family | Low level | High level | Example |
|--------|-----------|------------|---------|
| Debian / Ubuntu | `dpkg` (`.deb`) | `apt` | `sudo apt install nginx` |
| RHEL / Fedora / Rocky | `rpm` (`.rpm`) | `dnf` (older: `yum`) | `sudo dnf install nginx` |
| SUSE | `rpm` | `zypper` | `sudo zypper install nginx` |
| Arch | — | `pacman` | `sudo pacman -S nginx` |
| Alpine | — | `apk` | `apk add nginx` |
| Distribution-independent | — | `snap`, `flatpak` | Self-contained apps with bundled dependencies |

## Common Mistakes

- Running `apt upgrade` without `apt update` first — nothing new is found.
- Installing without `update` on a fresh system or container — "Unable to locate package" because the index is empty or stale.
- `sudo dpkg -i package.deb` and leaving unmet dependencies — use `apt install ./package.deb`.
- Expecting `apt remove` to delete configuration — use `purge`.
- Mixing repositories of different releases, or downloading random `.deb` files, leading to broken dependencies.
- Using `apt` in scripts (its output format may change and it warns about an unstable CLI) — use `apt-get`.
- Deleting files from `/var/lib/dpkg` or `/var/lib/apt` to "free space" — that corrupts the package database.

## Key Takeaways

- Packages = files + metadata + dependencies; repositories are signed sources; the package manager tracks every file.
- `apt update` refreshes the index; `apt upgrade` installs newer versions; `full-upgrade` may also remove packages.
- `apt install` / `remove` / `purge` / `autoremove`; `apt search`, `apt show`, `apt-cache policy`.
- `dpkg -l`, `-L`, `-S` answer "is it installed / what files / which package owns this file?".
- RHEL family uses `dnf`/`rpm`, Alpine `apk`, Arch `pacman`.
