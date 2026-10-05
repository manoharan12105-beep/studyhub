# Permissions and Users Interview Questions

**Module:** Interview · **Interview priority:** Core

## What Is It?

An interview bank on file permissions, ownership, `umask`, SUID/SGID/sticky bit, users, groups, `/etc/passwd` and `/etc/shadow`, and privilege with `su` and `sudo`. Permissions are among the most frequently asked Linux topics because they combine theory (octal notation) with daily troubleshooting ("Permission denied"). The [questions](interview-questions.md) mix definitions, calculations and scenarios.

## Why It Matters

- Expect at least one "what does `chmod 754` mean?" and one "why can't this user access the file?" question.
- Security questions (SUID, sudo, `777`) test judgement as well as knowledge.

## Core Concept

### How to answer a permission question

1. **Translate** octal ↔ symbolic out loud (`754` = `rwxr-xr--`).
2. **Identify which class applies** — owner, then group, then others; the first match wins.
3. **Remember directories differ**: `r` list, `w` create/delete, `x` enter.
4. **Recommend least privilege** in any fix.

### Coverage

| Area | Lessons |
|------|---------|
| Permissions | [File Permissions](../../permissions/file-permissions/content.md), [Ownership and umask](../../permissions/ownership-and-umask/content.md), [Special Permissions](../../permissions/special-permissions/content.md) |
| Users and groups | [Users and Groups Basics](../../users-and-groups/users-and-groups-basics/content.md), [User and Group Management](../../users-and-groups/user-and-group-management/content.md), [su and sudo](../../users-and-groups/su-and-sudo/content.md) |

## Key Takeaways

- `r=4 w=2 x=1`, per class owner/group/others; `chmod 640`, `chmod u+x,go-w`.
- Directories: `r` list names, `w` create/delete entries (with `x`), `x` enter/traverse.
- New files: `666 & ~umask`, directories `777 & ~umask` (umask `022` → 644/755).
- SUID (`4xxx`, `s` in owner x) runs as the file owner; SGID (`2xxx`) runs as the group / inherits the group on directories; sticky (`1xxx`, `t`) restricts deletion.
- Users in `/etc/passwd`, hashes in `/etc/shadow`, groups in `/etc/group`; `usermod -aG` (never forget `-a`); `sudo` runs one command with your password and is logged.
