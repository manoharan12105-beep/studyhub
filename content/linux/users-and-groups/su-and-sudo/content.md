# su and sudo

**Module:** Users and Groups · **Interview priority:** Core

## What Is It?

Two ways to act as another user — usually root:

- **`su`** (switch user) starts a **shell** as another user. You must know **that user's** password.
- **`sudo`** runs **one command** as another user (root by default), after checking a policy file (`/etc/sudoers`). You type **your own** password, and the action is logged.

```text
su -              → "become root"  (needs root's password, gives a root shell)
sudo apt update   → "run this one command as root" (needs your password and permission)
```

## Why It Matters

- Day-to-day administration on Ubuntu, cloud VMs and most servers is done with `sudo`; the root account often has no password at all.
- `sudo` gives accountability (who ran what), fine-grained control (which user may run which commands) and easy revocation.
- Interviewers ask "su vs sudo", "su vs su -", "how do you give a user sudo rights?", "what is visudo?".

## Core Concept

### su

```bash
# Illustrative: interactive
su                 # shell as root, but keeps most of YOUR environment (PATH, HOME may differ)
su -               # login shell as root: root's environment, home directory, PATH
su - alice         # login shell as alice (needs alice's password)
su -c 'whoami' alice   # run one command as alice
exit               # return to your own shell
```

- `su -` (same as `su -l` / `su --login`) runs root's login scripts and starts in `/root` with root's `PATH`. Plain `su` keeps your current directory and much of your environment, which can lead to confusing behaviour (e.g. your `PATH` without `/usr/sbin`).
- Root running `su - alice` needs no password.
- Many distributions (Ubuntu) lock the root password, so `su` to root fails; use `sudo -i` instead.

### sudo

```bash
# Illustrative: needs a sudo-enabled account
sudo apt update                # one command as root
sudo -u postgres psql          # one command as another user
sudo -i                        # interactive root login shell (root's environment)
sudo -s                        # root shell keeping your environment
sudo -l                        # list what you are allowed to run
sudo -k                        # forget the cached authentication now
sudo !!                        # repeat the previous command with sudo
sudoedit /etc/hosts            # edit a file safely as root (your editor runs as you)
```

How it works:

1. `sudo` is a SUID-root program, so it starts with root privileges.
2. It reads `/etc/sudoers` (and `/etc/sudoers.d/*`) to decide whether **your user**, on **this host**, may run **this command** as **the target user**.
3. It asks for **your** password (unless the rule says `NOPASSWD`) and caches success for a few minutes (`timestamp_timeout`, commonly 15 or 5 minutes) per terminal.
4. It logs the command (to `/var/log/auth.log` or `/var/log/secure`, and the systemd journal) and runs it.

Failed attempts by users without permission are logged and reported: "alice is not in the sudoers file. This incident will be reported."

### The sudoers file

Always edit it with **`visudo`**, which locks the file and checks the syntax before saving. A syntax error in `sudoers` can lock everyone out of `sudo`.

```bash
# Illustrative: needs root
sudo visudo                               # edit /etc/sudoers
sudo visudo -f /etc/sudoers.d/deploy      # create a drop-in file (preferred)
```

Rule format:

```text
who    where = (as_whom)       what
alice  ALL   = (ALL:ALL)       ALL
│      │       │   │           └─ commands (ALL = any)
│      │       │   └─ as which group
│      │       └─ as which user
│      └─ on which hosts (ALL; matters only when one file is shared by many hosts)
└─ user, or %group
```

Common rules:

```text
# Members of group sudo (Debian/Ubuntu) or wheel (RHEL) may run anything as anyone
%sudo   ALL=(ALL:ALL) ALL
%wheel  ALL=(ALL)     ALL

# The deploy user may restart one service, without a password
deploy  ALL=(root) NOPASSWD: /usr/bin/systemctl restart inventory

# Developers may run commands as the app user only
%developers ALL=(app) ALL
```

So "give a user sudo rights" usually means: `sudo usermod -aG sudo alice` (Ubuntu) or `sudo usermod -aG wheel alice` (RHEL), then log in again.

## Commands

### Checking who you are, before and after

```bash
whoami
```

**Output:**

```text
student
```

```bash
# Illustrative: with sudo rights
sudo whoami                  # root
sudo -u postgres whoami      # postgres
echo $SUDO_USER              # inside a sudo session: the original user
```

### Redirection with sudo

```bash
# Illustrative
sudo echo "127.0.0.1 test" >> /etc/hosts            # fails: your shell opens the file
echo "127.0.0.1 test" | sudo tee -a /etc/hosts      # works
```

The redirection is performed by your unprivileged shell before `sudo` starts. See [xargs and tee](../../text-processing/xargs-and-tee/content.md).

## Examples

### Least-privilege rule for a deployment script

```text
# /etc/sudoers.d/deploy  (created with: sudo visudo -f /etc/sudoers.d/deploy)
deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart inventory, /usr/bin/systemctl status inventory
```

The CI job can restart one service and nothing else; full paths prevent a fake `systemctl` earlier in `PATH` from being used.

### Security considerations

| Practice | Why |
|----------|-----|
| Use personal accounts with `sudo`, not a shared root password | Accountability: logs show who did what; revoke one person without changing a shared secret |
| Disable direct root SSH login (`PermitRootLogin no`) | Attackers must guess a username and a password/key, and actions are tied to people |
| Grant specific commands, not `ALL`, where possible | Least privilege |
| Avoid `NOPASSWD: ALL` for humans | A stolen session or a malicious script becomes root silently |
| Never allow editors, pagers, shells or interpreters via sudo for restricted users | `sudo vim` → `:!bash` gives a root shell; `less`, `find -exec`, `python` likewise ("shell escapes") |
| Use `sudoedit` to let users edit specific files | The editor runs as the user; only the save is privileged |
| Prefer `sudo -i` to `sudo su -` | Same result, one fewer program, clearer logs |
| Review `/etc/sudoers.d/` and sudo logs | Detect unexpected grants and misuse |

## Comparison

### su vs sudo

| | `su` | `sudo` |
|---|---|---|
| Password asked | Target user's (root's) | Your own (per policy) |
| Scope | A whole shell session | One command (or a shell with `-i`/`-s`) |
| Access control | Anyone who knows the password | Per user/group/command rules in `sudoers` |
| Logging | Session start only | Every command |
| Revoking access | Change the shared password | Remove the user from the group/rule |
| Typical on | Older setups, RHEL with a root password | Ubuntu, cloud images, most modern servers |

### su vs su -

| | `su` | `su -` |
|---|---|---|
| Shell type | Non-login | Login |
| Environment | Mostly yours (your `PATH`, variables) | Clean, target user's |
| Working directory | Unchanged | Target's home |
| Startup files | `.bashrc` of target | `.profile`/`.bash_profile` of target (which usually sources `.bashrc`) |

### sudo -i vs sudo -s

| | `sudo -i` | `sudo -s` |
|---|---|---|
| Like | `su -` | `su` |
| Environment | Root's login environment, `HOME=/root` | Your environment, root privileges |

## Common Mistakes

- Editing `/etc/sudoers` with a plain editor and saving a syntax error — `sudo` then refuses to run for everyone. Always `visudo`.
- `usermod -G sudo alice` without `-a`, removing her other groups.
- Running everything inside `sudo -i` for hours — mistakes become root mistakes; use `sudo` per command.
- Expecting `sudo cmd > /root/file` to write as root.
- Giving restricted users `sudo` access to `vim`, `less`, `find`, `tar` or interpreters, which allow shell escapes.
- Using `su` without `-` and being surprised that admin commands are "not found" (no `/usr/sbin` in `PATH`).

## Key Takeaways

- `su` = become another user (their password), `su -` = with their full login environment.
- `sudo` = run one command as root/another user with your password, controlled by `/etc/sudoers`, logged.
- Edit sudoers only with `visudo`; prefer drop-ins in `/etc/sudoers.d/`.
- Rule format: `who where=(as_whom) what`; groups with `%`; `NOPASSWD:` skips the password.
- Admin rights on Ubuntu: group `sudo`; on RHEL: group `wheel`.
- Least privilege: specific commands, no shell escapes, no shared root password, no root SSH login.
