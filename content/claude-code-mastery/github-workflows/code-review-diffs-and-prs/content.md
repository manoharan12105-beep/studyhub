# Code Review, Reviewing Diffs and Pull Request Preparation

**Module:** Git and GitHub Workflows · **Interview priority:** Frequently asked

> [!NOTE]
> **Checked against:** Claude Code v2.1.289, the commands reference and *Code Review* (October 2026). `/code-review`, `/security-review` and the managed Code Review service were **not** run for this lesson; their behaviour is described from the documentation. The managed service is a research preview for Team and Enterprise plans.

## Definition

**Reviewing a diff** means reading every changed line against the intent of the change: does it do what was asked, only that, safely, with tests that prove it? **Pull request preparation** packages a reviewed change so that a human reviewer can understand and check it quickly: a focused diff, a clear description, evidence of testing and an honest list of what wasn't verified.

## Why It Matters

- AI-written diffs look plausible. Plausibility is not correctness — reading with intent is how you tell them apart.
- Reviewer time is the bottleneck in most teams. A PR that states intent, evidence and risks gets reviewed faster and better.
- Automated reviews (Claude's or anyone's) are **advisory**. The decision to merge stays with people.

## How It Works

```text
working tree ──► /diff or git diff ──► you read with intent (checklist)
                     │
                     ├──► /code-review           correctness bugs (background subagent)
                     ├──► /security-review       security issues vs origin's default branch
                     └──► reviewer subagents     your own lenses
                     ▼
            validated fixes ──► tests ──► PR description ──► human review + CI ──► merge
```

## Reading a Diff with Intent

| Check | Question |
|-------|----------|
| Intent | Does each hunk serve the task? Could you explain why it exists? |
| Scope | Any file or line the task didn't need (refactors, renames, formatting)? |
| Behaviour | Null, empty, boundary and error paths; transactions; HTTP status codes |
| Tests | New behaviour tested? Any assertion removed, loosened or `@Disabled`? |
| Security | String-built SQL, logged personal data, validation removed, secrets |
| Dependencies and schema | `pom.xml` changes, new migrations, edited old migrations |
| Leftovers | Debug prints, commented-out code, TODOs, generated files |

Read tests **first**: they tell you what the author believes the change does.

## Review Commands in Claude Code

| Command | What it does | Notes |
|---------|--------------|-------|
| `/diff` | Shows working-tree changes, including Claude's edits so far | Your own reading |
| `/code-review [effort] [--fix] [--comment] [target]` | Reviews your branch's commits ahead of upstream plus uncommitted changes for **correctness bugs**; target can be a path, PR number, branch or range | Runs as a background subagent; `/review` is an alias; `--fix` applies findings (background `--fix` edits are outside checkpoints — use Git to revert); `--comment` posts to the PR |
| `/security-review` | Reviews the diff between your branch and origin's default branch for security vulnerabilities | Needs an `origin` remote |
| `/simplify` | Cleanup review with four parallel agents; applies fixes | Does **not** look for correctness bugs |
| `/code-review ultra` | Deeper multi-agent cloud review | Billed; requires a claude.ai account; you start it, not Claude |

`/code-review low` reports fewer, higher-confidence findings; higher levels broaden coverage. Claude can start `/code-review` on its own when you ask it to review; `"skillOverrides": { "code-review": "user-invocable-only" }` keeps it manual.

> [!NOTE]
> **Code Review** (the managed GitHub service) runs specialized agents on Anthropic infrastructure, verifies candidate findings, and posts inline comments tagged by severity. It **doesn't approve or block** pull requests. It reads `CLAUDE.md` and a `REVIEW.md` for review-specific guidance; the local `/code-review` reads `CLAUDE.md` but not `REVIEW.md`.

## What a Reviewer Checks

A useful review result has, for each finding: location (`file:line`), the problem, a triggering input or scenario, severity, and confidence. Treat findings as **hypotheses**: open the line, trace the input, reproduce if it matters. Reviews prompted to find gaps will usually report some even when the work is sound — fix what affects correctness or the requirements, and treat the rest as optional.

## Preparing a Pull Request

```markdown
## FEAT-7: Mark an order as paid

**What:** `POST /api/orders/{id}/pay`. NEW → PAID (200); PAID again → 200, unchanged;
CANCELLED/SHIPPED → 409; unknown → 404. No schema change.

**How:** `Order.markPaid()` holds the state rule; the controller maps a refused transition to 409.

**Verified:** `./mvnw -B verify` — Tests run: 14, Failures: 0, Errors: 0. One test per
acceptance criterion in `OrderControllerTest`.

**Not verified:** concurrent pay requests for the same order. No cancel API exists, so the
409 test sets the status with SQL.

**Review focus:** the 409 mapping in `OrderController.pay`.
```

| Element | Why |
|---------|-----|
| Intent in one paragraph | The reviewer knows what "correct" means |
| Verification with real output | Evidence, not "tests pass" |
| Not verified | Honest risk; guides the reviewer |
| Review focus | Spends reviewer attention where it matters |
| Small, single-purpose diff | Reviewable in one sitting |

Claude can write the description and run `gh pr create`; Claude Code then links the session to the PR (`claude --from-pr <number>` finds it later). Pushing and opening the PR are still outward-facing actions — keep them behind `ask` rules and do them when the description matches the diff.

## Syntax and Configuration

```text
/diff
/code-review high
/code-review main...feat/7-mark-order-paid
/security-review
```

```bash
git diff --stat main...HEAD     # what the PR will contain
git log --oneline main..HEAD    # commits the PR will contain
```

## Real-World Example

Reviewing the orderdesk BUG-101 fix with intent catches what the issue only hints at: support noticed failed creates were still stored. A diff that only adds the null check fixes the 500 but leaves `create()` non-transactional; the verified starter run stored the row (rows after a failed create: 1), while with `@Transactional` it was rolled back (rows: 0). A reviewer reading "what happens to stored data when a request fails?" asks for both.

## Step-by-Step Walkthrough

1. `git diff --stat` — does the shape match the plan?
2. Read tests, then production code, hunk by hunk, with the checklist.
3. Run `/code-review` (and `/security-review` for sensitive changes); validate each finding.
4. Fix validated findings in small steps; re-run the build.
5. Write the PR description with evidence and gaps.
6. Push and open the PR yourself (or approve Claude's `gh pr create` after reading it).

## Common Mistakes

- Reviewing the summary instead of the diff.
- Running `/code-review --fix` in the background and expecting `/rewind` to undo it.
- Treating "no findings" as proof of correctness.
- PRs mixing a fix, a refactor and formatting.
- Descriptions that claim verification that didn't happen.

## Security Considerations

- Use `/security-review` or a security lens for changes touching input handling, SQL, authentication or secrets — and still review it yourself.
- Never paste secrets into PR descriptions; check the diff for credentials before pushing.
- Posting findings to a PR (`--comment`) publishes them; on public repositories, that includes vulnerability details.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `/code-review` says nothing to review | No commits ahead of upstream and no uncommitted changes | Pass a target (branch, range, PR) |
| `/security-review` fails with `ambiguous argument` | No usable `origin` default branch | Add/fetch the `origin` remote |
| `--fix` edits survive `/rewind` | Background review edits are outside checkpoints | Revert with Git |
| PR shows unexpected files | Generated or unrelated files staged | `.gitignore`; stage selectively |

## Trade-offs

| Choice | Benefit | Cost |
|--------|---------|------|
| AI review before human review | Catches mechanical issues early | Findings need validation; tokens |
| `--fix` | Fast | Unreviewed edits; outside checkpoints |
| Detailed PR description | Faster, better review | Writing time |

## Interview Takeaways

- Read diffs with intent: scope, behaviour, tests, security, leftovers.
- `/diff`, `/code-review` (correctness), `/security-review` (security), `/simplify` (cleanup only).
- AI review is advisory; humans approve; PR descriptions carry evidence and gaps.

## Key Takeaways

- The diff is the truth; summaries and messages are claims.
- Validate every finding before acting on it.
- Small, honest PRs get good reviews.
- Push and open PRs deliberately.
