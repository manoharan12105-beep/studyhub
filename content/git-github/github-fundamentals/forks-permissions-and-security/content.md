# Forks vs Clones, Permissions and Repository Security

**Module:** GitHub Fundamentals · **Interview priority:** Frequently asked

> [!NOTE]
> Roles and settings describe GitHub as of 2026 (**Instruction only**). Organisation administrators can customise roles further.

## Learning Objectives

- Distinguish forking from cloning and know when each is used.
- Give people the least access they need using GitHub's repository roles.
- Apply basic security practices to any repository you own.

## What Is It?

- **Cloning** copies a repository **to your computer** (`git clone`). It's a Git operation.
- **Forking** copies a repository **to your GitHub account**, on GitHub's servers. It's a GitHub operation. You then clone your fork to work on it.

| | Clone | Fork |
|-|-------|------|
| Where the copy lives | Your machine | Your GitHub account |
| Tool | Git | GitHub (web, `gh repo fork`) |
| Needs write access to the original to push | Yes | No — you push to your fork |
| Typical use | Working on a repository you're a member of | Contributing to a project where you can't push (open source) |
| Link back | `origin` remote | GitHub records the "forked from" relationship; PRs can target the original |

## Why It Matters

Forks are how strangers contribute to open source without being given write access; permissions are how teams avoid "everyone is admin". Both are about the same question: **who can change what**.

## How It Works

### The fork workflow in one picture

```text
your-org/gradebook  (upstream — you can't push)
        │ Fork (on GitHub)
        ▼
your-username/gradebook  (origin — your fork, you can push)
        │ git clone
        ▼
your laptop ── push branch to origin ── open PR to upstream
```

```bash
git clone https://github.com/your-username/gradebook.git
cd gradebook
git remote add upstream https://github.com/your-org/gradebook.git
git remote -v
```

**Expected result:** `origin` points to your fork, `upstream` to the original project. The full contribution flow, including keeping your fork in sync, is in [Contributing to Open Source](../../pull-requests-and-review/open-source-contribution/content.md).

## Permissions

**Personal-account repositories** have one owner, who can invite **collaborators**. Collaborators can push and manage issues and pull requests, but most settings remain owner-only.

**Organisation repositories** grant roles to people or teams:

| Role | Can | Typical holder |
|------|-----|----------------|
| Read | View, clone, open issues and comment | Stakeholders, other teams |
| Triage | Read + manage issues and PRs (labels, assign, close) without pushing | Support, project managers |
| Write | Triage + push to branches, merge PRs (subject to protection) | Developers |
| Maintain | Write + manage some settings (not destructive or security ones) | Tech leads |
| Admin | Everything: settings, access, protection, deletion | Very few people |

Principle: **least privilege** — give the lowest role that lets someone do their job, manage access through **teams**, and remove access when people leave.

## Basic Repository Security Practices

1. **Turn on two-factor authentication** for your GitHub account (organisations can require it).
2. **Protect the default branch:** require pull requests, reviews and passing checks; block force pushes and deletion ([Branch Protection](../../team-workflows/branch-protection-and-code-ownership/content.md)).
3. **Keep secrets out of Git:** `.gitignore` local config, use Actions secrets for CI, and enable **secret scanning** and **push protection** so GitHub blocks pushes that contain recognised credentials ([Secrets in Git History](../../authentication-and-security/secrets-in-git-history/content.md)).
4. **Enable Dependabot alerts** for vulnerable dependencies (Maven projects are supported).
5. **Least-privilege access** for people, deploy keys (read-only unless writing is required), tokens and GitHub Apps; review them periodically.
6. **Add `SECURITY.md`** explaining how to report vulnerabilities privately.
7. **Be careful with forks of private repositories** — forks can retain access to code; review fork policies in organisation settings.

## Commands

```bash
# Illustrative — requires the GitHub CLI
gh repo fork your-org/gradebook --clone      # fork and clone in one step
```

| Command | Purpose | Safety |
|---------|---------|--------|
| `git clone <url>` | Local copy | Safe |
| `git remote add upstream <url>` | Track the original project | Local configuration |

## Step-by-Step Example

Setting up access for a 4-person student team project in an organisation:

1. Create a team `gradebook-devs` and give it **Write**.
2. Give the instructor **Read** (or **Triage** to manage issues).
3. Keep **Admin** to one or two people.
4. Protect `main`: PRs with one approval, the Maven CI check required, no force pushes.
5. Enable secret scanning, push protection and Dependabot alerts.

## Common Mistakes

- **Forking a repository you can push to** and then losing track of which copy is current. Members usually clone and branch.
- **Making everyone Admin** "to avoid permission problems".
- **Downloading a ZIP instead of forking/cloning** — no history, no remote.
- **Assuming a private repository makes committed secrets safe** — anyone with access (now or later) can read history.

## Interview Angle

"Fork vs clone?" is common: a fork is a server-side copy under your account (GitHub feature) used to contribute without write access; a clone is a local copy (Git feature). Follow-up on permissions: describe least privilege with Read/Triage/Write/Maintain/Admin and branch protection.

## Recap

- Clone = local copy (Git); fork = copy on GitHub under your account.
- Fork + clone + `upstream` remote is the open-source contribution setup.
- Organisation roles: Read, Triage, Write, Maintain, Admin — grant the least needed.
- 2FA, branch protection, secret scanning/push protection, Dependabot and access reviews are the basics.

## Related Topics

- [Contributing to Open Source](../../pull-requests-and-review/open-source-contribution/content.md)
- [Branch Protection and Code Ownership](../../team-workflows/branch-protection-and-code-ownership/content.md)
- [Personal Access Tokens and Credential Managers](../../authentication-and-security/tokens-and-credential-managers/content.md)
