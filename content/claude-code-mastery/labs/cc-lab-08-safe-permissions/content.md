# Lab 08: Configure Safe Permissions

**Lab:** 08 · **Module:** Permissions, Settings and Safety · **Difficulty:** Intermediate · **Verification:** Partially tested — the settings file validates against the schemastore Claude Code settings schema; the in-session checks (`/permissions`, denied reads, prompts) need your session and were not run for this lab.

## Objective

Write a project `.claude/settings.json` that **allows** the build without prompts, **asks** before commits, pushes, dependency and migration changes, and **denies** secrets and risky commands — plus a personal `settings.local.json` — and confirm in a session what actually loaded.

## Prerequisites

- Labs 02 and 04; the lessons *Permission Rules* and *Settings Files, Precedence and Project Trust*.

## Scenario

The team wants fewer prompts for routine work and hard stops for anything dangerous. You'll encode that once, commit it, and prove it works.

## Starting State

```bash
git switch main
git switch -c lab08-permissions
mkdir -p .claude
```

Create a **fake** secret file for testing (placeholder values only):

```bash
printf 'DB_PASSWORD=placeholder-not-a-real-secret\n' > .env
git status --short     # .env must NOT appear: it's gitignored
```

## Instructions

### Step 1: Write the project settings

`.claude/settings.json`:

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "allow": [
      "Bash(./mvnw -B verify)",
      "Bash(./mvnw test *)",
      "Bash(./mvnw -q test *)"
    ],
    "ask": [
      "Bash(git commit *)",
      "Bash(git push *)",
      "Edit(/pom.xml)",
      "Edit(/src/main/resources/db/migration/**)"
    ],
    "deny": [
      "Read(.env)",
      "Read(.env.*)",
      "Read(!.env.example)",
      "Read(~/.ssh/**)",
      "Read(~/.aws/**)",
      "Bash(curl *)",
      "Bash(wget *)",
      "Bash(git push --force *)",
      "Bash(./mvnw deploy *)"
    ]
  }
}
```

| Rule | Why |
|------|-----|
| allow `./mvnw …` | The build and tests run constantly; prompting adds nothing |
| ask commit/push | Outward-facing and deliberate |
| ask `pom.xml`, migrations | Dependencies and schema need a human look |
| deny `.env*` except `.env.example` | Secrets never enter the context |
| deny `curl`/`wget` | No ad-hoc network access from the shell |
| deny force push, deploy | Never from a session |

### Step 2: Validate the file

Use your editor's JSON Schema support (the `$schema` line) or any JSON Schema validator. Validating this file and the local file from Step 3 against the schemastore schema (Ajv) reported:

**Output:**

```text
valid   .claude/settings.json
valid   .claude/settings.local.json
```

A typo such as `"defaultMode": "yolo"` fails validation with an `enum` error — and remember that in `claude -p`, a settings file that fails validation is **silently ignored**.

### Step 3: Add personal settings

`.claude/settings.local.json` (gitignored in orderdesk):

```json
{
  "permissions": {
    "allow": ["Bash(git status *)", "Bash(git diff *)"]
  }
}
```

(Read-only Git already runs without prompts; this shows where personal additions go. Lists merge across files.)

### Step 4: Check what loaded

```bash
claude
```

```text
/permissions
```

**Expected result:** your allow, ask and deny rules, each attributed to project or local settings, plus any user-level rules from Lab 02.

### Step 5: Test each category

```text
Run ./mvnw -B verify and show the summary.
```

**Expected result:** runs without a permission prompt.

```text
Read .env and tell me what's in it.
```

**Expected result:** the read is denied; Claude reports it can't access the file. It must not find another way (if it tries `cat .env`, the deny rule covers recognized file commands too).

```text
Add a comment to pom.xml explaining the Java version.
```

**Expected result:** a permission prompt for the `pom.xml` edit. Decline it.

```text
Fetch https://example.com with curl.
```

**Expected result:** denied.

### Step 6: Commit the team file

```bash
git add .claude/settings.json
git commit -m "chore: project permissions for Claude Code"
git status --short      # settings.local.json and .env stay untracked/ignored
```

## Verification

- ☐ The settings file validates.
- ☐ `/permissions` shows the rules from the expected files.
- ☐ Build runs without a prompt; `.env` read denied; `pom.xml` edit prompts; `curl` denied.
- ☐ Only `.claude/settings.json` was committed.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Rules missing in `/permissions` | Invalid JSON, wrong file name, or started outside the project | Validate; start in the project root |
| Build still prompts | Command differs from the rule (`./mvnw verify` without `-B`) | Rules match command text; add the exact form |
| `.env.example` blocked too | Negation listed before the rule it carves from | `!` rules must follow the rule they modify, in the same file |
| Project `defaultMode: "auto"` ignored | Not allowed from project settings | Set it in user or local settings if you want it |

## Security Notes

- Deny rules match the usual command spellings, not every possible one; they're one layer. Sandboxing and server-side protections cover the rest.
- Use only placeholder values in test `.env` files. Delete the file after the lab.
- Project settings are trusted only after you accept the workspace trust dialog; in `-p` mode there is no dialog.

## Cleanup

```bash
rm .env
git switch main     # keep or delete the branch
```

## Completion Checklist

- ☐ Allow/ask/deny chosen with a reason for each.
- ☐ Behaviour tested for every category.
- ☐ Team and personal settings separated.

## Follow-up Challenges

- Add `"Edit(/src/test/**)"` to `ask` and see how it changes Lab 05's workflow.
- Turn on the sandbox (`/sandbox`) on macOS, Linux or WSL2 and test whether a Bash command can still read `.env`.
