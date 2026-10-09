# Common Failure Modes

## Agent Behaviour

| Failure | Symptom | Countermeasure |
|---------|---------|----------------|
| Plausible but wrong | Confident summary, wrong code | Require evidence: test output, `file:line` |
| Invented API / flag / setting | Compile error, or silently ignored config | Compile; check docs; validate settings and frontmatter |
| Weakened test | Expected value changed, `@Disabled`, deleted test | Review `src/test` diff; `ask` on test edits |
| Symptom fix | `catch (NullPointerException e)` | Reproduce; fix the cause |
| Scope creep | Unrelated files in the diff | `git diff --stat` vs plan; revert extras |
| "Should work now" | No command run | Ask for output; Stop hook or `/goal` running the build |
| Anchoring | First theory pursued despite evidence | Hypothesis + evidence; rewind; competing hypotheses |
| Polluted context | Same mistake after corrections | `/clear` or `/rewind`; better initial prompt |

## Configuration

| Failure | Cause | Fix |
|---------|-------|-----|
| Settings ignored | Invalid JSON (silently ignored in `-p`) | Validate with the schema |
| Skill never triggers | Broken YAML (empty metadata) or vague description | `claude plugin validate .claude/skills`; rewrite description |
| Subagent missing | No `name`/`description`, YAML error, new directory | Validate; restart; `--debug` |
| Reviewer edits files | No `tools` allowlist; permissive parent mode | `tools: Read, Grep, Glob` |
| Hook doesn't run | Not executable, wrong path, untrusted folder | `chmod +x`; test with piped JSON; trust the folder |
| Hook fails open | Missing dependency (jq) → exit 0 | Check dependencies; `exit 2` when missing |
| Deny rule bypassed | Different command spelling | Server-side protection, sandbox |
| Project `defaultMode: auto` ignored | Not allowed in project settings | Set it in user/local settings |

## Context and Sessions

| Failure | Fix |
|---------|-----|
| Forgotten decisions after compaction | Plan/decision files; `/compact` with focus |
| Wrong branch in answers | Snapshot is from conversation start — run `git status` |
| `/rewind` didn't undo a change | Bash side effects aren't tracked — use Git |
| Usage climbs all day | `/clear` between tasks; check `/usage` |

## Automation

| Failure | Fix |
|---------|-----|
| Script treats a failed run as success | Check exit code **and** `is_error` |
| CI step "fixes" by weakening tests | AI steps read-only; humans fix via PRs |
| Secrets exposed to fork PR code | No `pull_request_target` + fork checkout |
| Bot loops | Human-actor check; `allowed_bots` only when needed |
| Runaway cost | `--max-turns`, `--max-budget-usd`, `timeout-minutes`, `concurrency` |

## Spring Boot Specifics (orderdesk)

- 500 with NPE → handle valid null input at the use site, or validate at the boundary.
- Data saved despite 500 → missing transaction around save + response.
- `@Transactional` ignored → self-invocation or private method (proxy bypassed).
- `missing column [x]` at startup → new Flyway migration; never edit V1; keep `ddl-auto: validate`.
- Wrong rows from search → string-built SQL; use `?` parameters.
- Totals too low under load → non-thread-safe shared state; atomic operations.
