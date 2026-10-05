# Managing Users and Groups

**Module:** Users and Groups · **Interview priority:** Frequently asked

## What Is It?

The commands that create, change and remove accounts. They edit `/etc/passwd`, `/etc/shadow`, `/etc/group` and `/etc/gshadow` safely (with locking) and create or remove home directories.

| Task | Command |
|------|---------|
| Create a user | `useradd` (low-level, all distributions) · `adduser` (friendly wrapper on Debian/Ubuntu) |
| Change a user | `usermod` |
| Set or lock a password | `passwd` |
| Password ageing | `chage` |
| Delete a user | `userdel` |
| Create / change / delete a group | `groupadd` · `groupmod` · `groupdel` |
| Add / remove one member | `gpasswd -a` / `gpasswd -d` (or `usermod -aG`) |

All of them need root, so every example runs with `sudo` and is marked illustrative — try them in a VM or container, not on a shared machine.

## Why It Matters

- Onboarding and offboarding people, and creating service accounts for applications, are routine admin tasks.
- One wrong option (`usermod -G` without `-a`) silently removes a user from all their other groups — including `sudo`.
- Security: locking accounts, forcing password changes, and creating service users without logins.

## Core Concept

### What `useradd` changes

Creating user `asha` touches several places:

```text
/etc/passwd   asha:x:1001:1001:Asha Rao:/home/asha:/bin/bash
/etc/shadow   asha:!:20468:0:99999:7:::          (locked until a password is set)
/etc/group    asha:x:1001:                        (private primary group)
/home/asha/   created with -m, populated from /etc/skel (.bashrc, .profile)
```

Defaults (shell, home base, whether to create a private group and a home directory) come from `/etc/default/useradd` and `/etc/login.defs`. Distributions differ: on Ubuntu, `useradd` without `-m` creates **no** home directory and sets the shell to `/bin/sh`; on RHEL it creates the home directory by default.

### useradd vs adduser

| | `useradd` | `adduser` (Debian/Ubuntu) |
|---|---|---|
| Kind | Low-level binary from shadow-utils | Perl/Python wrapper around `useradd` |
| Interactive | No — everything via options | Yes — prompts for password and full name |
| Home directory | Only with `-m` (Debian/Ubuntu) | Created automatically |
| Scripts | Preferred (predictable) | Convenient for humans |
| On RHEL | Available | `adduser` is just a link to `useradd` |

## Commands

### useradd

**Purpose:** create an account.

| Option | Meaning |
|--------|---------|
| `-m` | Create the home directory |
| `-s /bin/bash` | Login shell |
| `-c "Full Name"` | Comment (GECOS) field |
| `-G group1,group2` | Supplementary groups |
| `-g group` | Primary group (instead of a new private group) |
| `-u 1500` | Specific UID |
| `-d /path` | Home directory path |
| `-e 2026-12-31` | Account expiry date |
| `-r` | System account (UID below 1000, no ageing, no home unless `-m`) |

```bash
# Illustrative: needs root
sudo useradd -m -s /bin/bash -c "Asha Rao" -G developers asha
sudo passwd asha                     # set an initial password
id asha
```

A service account that nobody can log in as:

```bash
# Illustrative: needs root
sudo useradd -r -s /usr/sbin/nologin -d /opt/inventory -M inventory
```

`-r` system UID, `nologin` shell, `-M` no home directory created.

### adduser

```bash
# Illustrative: Debian/Ubuntu, interactive
sudo adduser ravi                    # prompts for password, name, room, phone…
sudo adduser ravi developers         # Debian form: add an existing user to a group
```

### usermod

**Purpose:** change an existing account.

| Option | Meaning |
|--------|---------|
| `-aG group` | **Append** to a supplementary group (keep the others) |
| `-G g1,g2` | **Replace** all supplementary groups with exactly this list |
| `-g group` | Change the primary group |
| `-s shell` | Change the login shell |
| `-d /new/home -m` | Change home and move its contents |
| `-l newname` | Rename the login |
| `-L` / `-U` | Lock / unlock the password |
| `-e YYYY-MM-DD` | Set account expiry (`-e 1` expires immediately) |

```bash
# Illustrative: needs root
sudo usermod -aG docker asha         # add to docker, keep existing groups
sudo usermod -s /bin/zsh asha        # change shell
sudo usermod -L asha                 # lock the password
```

> [!WARNING]
> `usermod -G docker asha` (without `-a`) **replaces** Asha's supplementary groups with only `docker`. If she was in `sudo`, she just lost administrator rights. Always use `-aG` to add. `gpasswd -a asha docker` is an unambiguous alternative.

### passwd

**Purpose:** set or manage passwords. A normal user runs `passwd` to change their own (it asks for the current one); root can change anyone's.

| Command | Effect |
|---------|--------|
| `passwd` | Change your own password |
| `sudo passwd asha` | Set Asha's password |
| `sudo passwd -l asha` | Lock (prefix the hash with `!`) |
| `sudo passwd -u asha` | Unlock |
| `sudo passwd -e asha` | Expire: force a change at next login |
| `sudo passwd -S asha` | Status: locked/usable, last change, ageing values |
| `sudo passwd -d asha` | Delete the password (avoid — may allow passwordless login) |

### chage

**Purpose:** password ageing policy.

```bash
# Illustrative: needs root
sudo chage -l asha                   # show ageing information
sudo chage -M 90 -W 7 asha           # expire after 90 days, warn 7 days before
sudo chage -d 0 asha                 # force a password change at next login
```

### userdel

**Purpose:** remove an account.

```bash
# Illustrative: needs root
sudo userdel asha                    # remove account, KEEP /home/asha and mail
sudo userdel -r asha                 # also remove home directory and mail spool
```

> [!CAUTION]
> `userdel -r` deletes the home directory permanently. Back it up first, and check for files the user owns elsewhere (`sudo find / -xdev -user asha`) — after deletion they show a bare UID, which a future user with the same UID would inherit.

Before deleting, many teams **lock and expire** the account first (`usermod -L -e 1 asha`), kill their processes (`pkill -u asha`), and remove their cron jobs and SSH keys.

### groupadd, groupmod, groupdel

```bash
# Illustrative: needs root
sudo groupadd developers             # new group
sudo groupadd -g 2000 qa             # with a specific GID
sudo groupmod -n engineers developers   # rename developers → engineers
sudo groupmod -g 2001 qa             # change GID (files keep the old number!)
sudo groupdel qa                     # delete (fails if it is someone's primary group)
```

### gpasswd

```bash
# Illustrative: needs root
sudo gpasswd -a asha developers      # add one member
sudo gpasswd -d asha developers      # remove one member
```

## Examples

### Onboard a developer

```bash
# Illustrative: needs root
sudo useradd -m -s /bin/bash -c "Meena K" -G developers,docker meena
sudo passwd -e meena                 # after setting a temporary password, force a change
sudo mkdir -p /home/meena/.ssh
sudo cp meena.pub /home/meena/.ssh/authorized_keys
sudo chown -R meena:meena /home/meena/.ssh
sudo chmod 700 /home/meena/.ssh
sudo chmod 600 /home/meena/.ssh/authorized_keys
```

### Offboard a developer safely

```bash
# Illustrative: needs root
sudo usermod -L -e 1 meena           # lock password and expire the account
sudo pkill -KILL -u meena            # end their running processes
sudo crontab -r -u meena             # remove their cron jobs
sudo tar -czf /root/meena-home.tar.gz /home/meena   # archive the home directory
sudo userdel -r meena
```

## Comparison

### usermod -G vs usermod -aG vs gpasswd -a

| Command | Existing supplementary groups | Result |
|---------|-------------------------------|--------|
| `usermod -G docker asha` | Removed | Only `docker` |
| `usermod -aG docker asha` | Kept | Existing + `docker` |
| `gpasswd -a asha docker` | Kept | Existing + `docker` |

### Locking methods

| Method | Blocks password login | Blocks SSH key login |
|--------|-----------------------|----------------------|
| `passwd -l` / `usermod -L` | Yes | Not necessarily (PAM-based sshd still allows keys) |
| `usermod -e 1` (expire account) | Yes | Yes |
| `usermod -s /usr/sbin/nologin` | Interactive shells refused | Shell refused (port forwarding may still work) |

## Common Mistakes

- `usermod -G` without `-a` — the most famous account-management mistake.
- Creating users with `useradd` on Ubuntu without `-m` and `-s /bin/bash`, then wondering why there is no home directory and the shell is `sh`.
- Expecting group changes to apply to running sessions — the user must log in again.
- `userdel -r` without a backup.
- Thinking `passwd -l` fully disables an account; expire it as well.
- Reusing UIDs: files left behind by a deleted user become owned by the new user with the same UID.

## Key Takeaways

- `useradd -m -s /bin/bash -G group user` creates a user; `adduser` is the interactive Debian wrapper.
- `usermod -aG group user` adds a group; `-G` alone replaces all supplementary groups.
- `passwd` sets (`-l` lock, `-u` unlock, `-e` force change, `-S` status); `chage` controls ageing.
- `userdel -r` removes the account and its home — back up first.
- `groupadd`, `groupmod -n`, `groupdel`, `gpasswd -a/-d` manage groups.
- Service accounts: `useradd -r -s /usr/sbin/nologin`.
