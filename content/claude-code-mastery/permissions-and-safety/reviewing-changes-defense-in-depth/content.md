# Reviewing Changes and Defense in Depth

**Module:** Permissions, Settings and Safety · **Interview priority:** Core

## Definition

**Reviewing changes** means reading and understanding every change Claude makes before you accept it into your branch — the diff, the commands that ran and the evidence that it works. **Defense in depth** is the principle that no single control is trusted to stop every failure: permission modes, permission rules, hooks, the sandbox, Git, tests, CI and human code review each catch different problems, and they are layered so that one failing does not mean an incident.

## Why It Matters

- An agent can produce a large, plausible diff in minutes. Plausible is not correct: it can contain a misread requirement, a weakened test, a debug line that logs personal data or an unrelated refactor.
- The documentation says it directly: you are responsible for reviewing proposed code and commands before approval.
- Interviewers want to hear that you treat AI output like a pull request from a fast, capable, occasionally overconfident colleague.

## How It Works

Think of each control as a slice with holes; incidents happen when holes line up.

| Layer | Protects against | Does not protect against |
|-------|------------------|--------------------------|
| **Permission mode** | Actions running without your attention | Mistakes in actions you approve |
| **Permission rules** | Specific forbidden or unreviewed actions (enforced) | Commands spelled differently than the rule (Bash) |
| **Hooks** | Patterns your script detects, every time | Anything your script doesn't check; a hook that fails open |
| **Sandbox** | Shell commands reaching files or hosts outside the boundary | File tools, MCP servers, hooks; allowed-but-abused domains |
| **Checkpoints** | Recent unwanted file-tool edits (fast undo) | Shell edits, subagent edits, remote effects |
| **Git** | Lost work; enables review and revert | Uncommitted work you discard; remote effects |
| **Tests and CI** | Behaviour regressions the tests cover | Behaviour no test checks; tests edited to pass |
| **Code review** | Wrong intent, poor design, security flaws, scope creep | Whatever the reviewer doesn't read carefully |
| **Branch protection, environments** | Unreviewed merges and deploys (server-enforced) | Changes outside the protected path |
| **Least privilege credentials** | The blast radius of everything above failing | — |

## Reviewing Changes Before Acceptance

**Where to see the change:**

| Tool | What it shows |
|------|---------------|
| Permission prompt (Manual mode) | Each edit or command before it runs |
| `/diff` | The working tree's changes, including Claude's edits, inside Claude Code |
| `git diff`, `git diff --stat` | The authoritative view of what will be committed |
| IDE diff viewer (VS Code extension, JetBrains plugin) | Visual side-by-side review |
| `/code-review`, `/security-review` | Claude reviewing the diff — a second opinion, not a substitute for yours (Module 9) |

**A review checklist for AI-written diffs:**

1. **Scope:** does every changed file belong to the task? Look for drive-by refactors and formatting churn.
2. **Intent:** does the change implement what was asked — including edge cases from the issue?
3. **Tests:** were tests added for new behaviour? Were any existing assertions changed, skipped or deleted?
4. **Evidence:** did the build and tests actually run after the last edit? Read the output, not the summary.
5. **Security:** new SQL string concatenation, logging of personal data, disabled checks, broadened CORS, secrets in code?
6. **Dependencies and configuration:** changes to `pom.xml`, `application.yml`, migrations, CI files?
7. **Invented APIs:** methods, annotations or properties that do not exist in your versions?
8. **Leftovers:** debug prints, commented-out code, TODOs, temporary files?

## Syntax and Configuration

Review is a habit, but configuration can force review points:

```json
{
  "permissions": {
    "ask": [
      "Bash(git commit *)",
      "Bash(git push *)",
      "Edit(/pom.xml)",
      "Edit(/src/main/resources/db/migration/**)",
      "Edit(/.github/workflows/**)"
    ]
  }
}
```

Plus, on the server: branch protection requiring a pull request, a passing CI check and an approving review.

## Real-World Example

Claude fixes BUG-101 and reports: *"Fixed the NPE in PriceCalculator; all tests pass."* Reviewing `git diff --stat` shows three files: `PriceCalculator.java` (expected), `PriceCalculatorTest.java` (expected) and `application.yml` (unexpected). The diff of `application.yml` shows `spring.jpa.hibernate.ddl-auto: update` — Claude changed it while chasing an unrelated startup warning. The tests pass, but `update` would let Hibernate alter production schemas outside Flyway. The review catches what the tests could not; you revert that file and add the rule "ddl-auto stays validate" to `CLAUDE.md`.

## Step-by-Step Walkthrough

1. Before the task: commit or stash so the diff contains only Claude's work.
2. During: keep consequential actions behind prompts or ask rules.
3. After: `git diff --stat` for scope, then `git diff` file by file with the checklist.
4. Run the build and tests yourself once, or read the full output of Claude's run.
5. Ask Claude to explain anything surprising ("why did application.yml change?").
6. Revert what doesn't belong; commit only what you understand.

## Common Mistakes

- Reviewing Claude's summary instead of the diff.
- Accepting "all tests pass" without checking that tests ran after the final edit.
- Letting a large diff through because it "looks fine" — split the task instead.
- Treating `/code-review` output as the review rather than an input to it.
- Believing one strong layer (auto mode, a hook, the sandbox) makes the others optional.

## Security Considerations

- The most damaging AI-introduced bugs are security regressions that pass tests: injection, missing authorization checks, permissive CORS, secrets in logs. Review security-relevant files with extra care.
- Changes to CI workflows, build files and Claude Code's own configuration (`.claude/`, `.mcp.json`) change what runs later — review them like code that executes.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Diffs are too big to review | Task too large | Plan in smaller steps; one concern per change |
| Unrelated files keep changing | Formatter or broad instructions | Scope the task; check hooks and CLAUDE.md for "also refactor" rules |
| "Tests pass" but CI fails | Tests ran before the last edit, or different command/profile | Require the exact definition-of-done command after the final edit |

## Trade-offs

| More review | Less review |
|-------------|-------------|
| Fewer escaped defects | Faster throughput |
| Slower, needs focus | Higher risk; defects reach CI or production |

Balance by making changes small and reviewable, not by skipping review.

## Interview Takeaways

- No single control is enough; name the layers and what each misses.
- Describe your diff-review checklist and how you verify evidence.
- Explain how configuration (ask rules, branch protection) creates mandatory review points.

## Key Takeaways

- Review the diff, not the summary.
- Each safety layer has holes; layer them so they don't line up.
- Tests catch regressions they cover; humans catch intent, scope and security.
- Small changes are reviewable changes.
