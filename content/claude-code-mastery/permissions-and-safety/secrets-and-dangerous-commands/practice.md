# Protecting Secrets and Preventing Dangerous Commands — Practice

### P1. Block .env

**Difficulty:** Easy · **Type:** Configuration · **Concepts:** Read deny

Write deny rules that block reading `.env` and `.env.local` files anywhere in the project but still allow `.env.example`.

<details>
<summary>Answer</summary>

```json
{
  "permissions": {
    "deny": ["Read(.env)", "Read(.env.*)", "Read(!.env.example)"]
  }
}
```

Bare filenames match at any depth; the `!` negation carves `.env.example` out of the earlier `.env.*` rule in the same list.

</details>

### P2. Sandbox coverage

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** sandbox scope

With the sandbox enabled, which of these is **not** restricted by it?

- A) `cat ~/.aws/credentials` run through Bash, with a `credentials` deny entry
- B) A network connection from `./mvnw` to a host not in `allowedDomains`
- C) Claude reading a file with the Read tool
- D) A child process started by a sandboxed command

<details>
<summary>Answer</summary>

**Answer:** C) Claude reading a file with the Read tool

The sandbox wraps shell commands and their children. The Read, Edit, Write and WebFetch tools follow permission rules instead.

</details>

### P3. Critical path

**Difficulty:** Medium · **Type:** Output prediction · **Concepts:** critical paths

In bypass permissions mode, Claude runs `rm -rf "$BUILD_DIR"/*` where `BUILD_DIR` was never set in the command. What happens?

<details>
<summary>Answer</summary>

Claude Code treats a glob directly under a shell variable as a **critical-path** removal (an empty variable turns it into `rm -rf /*`). No allow rule or hook can approve it; in bypass mode it still prompts (with a two-minute countdown in the terminal). The safe rewrite is `rm -rf "${BUILD_DIR:?}"/*` or a literal path.

</details>

### P4. Which control?

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** layered controls

Match each risk to the strongest practical control: (1) Claude reading `~/.ssh/id_ed25519` via the Read tool; (2) a test script uploading data to an unknown host; (3) Claude editing `V1__create_orders.sql`; (4) a production deploy from a laptop.

<details>
<summary>Answer</summary>

(1) `Read(~/.ssh/**)` deny rule (and sandbox `credentials` for shell access).
(2) Sandbox network isolation with a minimal `allowedDomains`.
(3) An ask rule on migration edits plus a PreToolUse hook that blocks edits to existing migrations.
(4) Remove production credentials from the laptop; deploy only through CI with a required-reviewer environment.

</details>

### P5. Debugging a datasource safely

**Difficulty:** Medium · **Type:** Workflow design · **Concepts:** secrets in context

The app cannot connect to PostgreSQL locally. Write a prompt that lets Claude help without any secret entering the conversation.

<details>
<summary>Answer</summary>

"Don't read .env. Read application.yml and tell me which environment variables the datasource needs. Then give me a command I can run myself that prints only whether each variable is set (not its value), and list likely causes for 'connection refused'." You keep values outside the session; Claude works with names and error messages.

</details>

### P6. Dependency request

**Difficulty:** Medium · **Type:** Security · **Concepts:** supply chain

Claude proposes adding `com.examp1e:json-utils:0.0.3` to `pom.xml` to "simplify JSON parsing". What do you check, and which rule makes sure you see such changes?

<details>
<summary>Answer</summary>

Check whether the dependency is needed at all (Jackson is already present in Spring Boot), whether the coordinates are legitimate (the `examp1e` lookalike is a typo-squatting warning sign), its maintainers, version and licence. An `ask` rule on `Edit(/pom.xml)` forces a prompt for every build-file change, even in Accept edits or auto mode.

</details>

### P7. The unsandboxed retry

**Difficulty:** Hard · **Type:** Failure diagnosis · **Concepts:** sandbox escape hatch

With the sandbox in auto-allow mode, a build fails because `downloads.example.org` is blocked, and Claude asks to run the command "unsandboxed". What should you consider, and how could an administrator remove this option?

<details>
<summary>Answer</summary>

The retry runs outside the sandbox — no filesystem or network limits. Ask why the host is needed; if it is legitimate, add that exact host to `network.allowedDomains` instead of running unsandboxed. Administrators can set `"allowUnsandboxedCommands": false` (strict sandbox mode) in managed settings so the `dangerouslyDisableSandbox` retry is ignored.

</details>

### P8. Leaked token

**Difficulty:** Hard · **Type:** Security · **Concepts:** incident response

A session transcript shows Claude printed a GitHub token from an environment variable while debugging, and the PR description draft includes it. List the response steps.

<details>
<summary>Answer</summary>

1. Revoke the token immediately and issue a new one with least privilege.
2. Remove it from the draft and anywhere it was pasted or committed (and from history if committed, knowing that does not make the old token safe).
3. Check the token's audit log for use.
4. Prevent recurrence: sandbox `credentials` with `GITHUB_TOKEN` in `envVars` (`deny`), and never ask Claude to print environment values. Consider a hook that blocks `printenv`/`env` patterns.

</details>
