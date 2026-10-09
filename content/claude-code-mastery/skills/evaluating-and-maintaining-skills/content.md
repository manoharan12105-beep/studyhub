# Evaluating and Maintaining Skills

**Module:** Skills, Slash Commands and Reusable Workflows · **Interview priority:** Awareness

> [!NOTE]
> **Checked against:** Claude Code v2.1.289 (`claude plugin --help`, `claude plugin eval --help`) and *Extend Claude with skills* (October 2026). No eval suite was run for this lesson: evals start real model sessions on your own account. The commands below are documented; their output is not shown.

## Definition

**Evaluating** a skill means measuring two things separately: whether Claude **invokes** it on the requests it should (and not on others), and whether the result is **better** than without the skill. **Maintaining** skills means keeping them correct as the code changes, keeping their context cost justified, sharing them at the right scope and retiring the ones nobody uses.

## Why It Matters

- Seeing a skill trigger proves Claude found it, not that it helped.
- Every listed skill costs context in every session, used or not.
- Skills go stale: a renamed test class or a new build command silently turns a good skill into a misleading one.

## How It Works

The core method is a **baseline comparison**:

```text
realistic prompts ──► fresh session WITH the skill    ──► result A ─┐
                  └─► fresh session WITHOUT the skill ──► result B ─┴─► compare: triggered? better? cost?
```

- Use **fresh sessions**: leftover context from writing the skill hides gaps in its instructions.
- Turn a personal or project skill off for the baseline with `skillOverrides` set to `"off"`; plugin skills aren't affected by `skillOverrides`, so use `claude plugin eval`, which adds a no-plugin baseline itself.
- Include prompts that **should not** trigger the skill.

## Testing Triggering and Usefulness

| Measure | How | Good sign |
|---------|-----|-----------|
| Triggers when it should | 3–5 should-trigger prompts in fresh sessions | Skill loads each time |
| Doesn't trigger otherwise | 3–5 near-miss prompts ("explain this diff" vs "review my changes") | Skill doesn't load |
| Helps | Same task with and without the skill; compare against a checklist | Fewer misses, consistent report |
| Costs | Tokens and time with vs without | Improvement worth the overhead |

For a manual-only skill, only the second and third rows matter: it never triggers on its own by design.

## Evals: claude plugin eval and skill-creator

Two documented tools automate the comparison; their formats are **not** interchangeable:

| Tool | For | What it does |
|------|-----|--------------|
| `claude plugin eval [target]` | Skills shipped in a **plugin** | Runs eval cases (`evals/**/case.yaml`, or `prompt.md` + `graders/*.md`) in isolated sessions with and without the plugin, scores them with graders, reports the score difference and can exit non-zero below a threshold for CI. A `tool_used: Skill` grader measures triggering |
| `skill-creator` plugin | Iterating on one skill inside a conversation | Stores cases in `evals/evals.json`, runs each in a fresh subagent, grades assertions, benchmarks with vs without, compares two versions blind and tunes the description |

> [!WARNING]
> `claude plugin eval` runs the plugin on your machine, as you, and each run is a real model session on your credentials. Evaluate only plugins you trust; the CLI's own help says its sandboxing limits but does not guarantee safety, and a passing suite is not a security vetting.

## Finding Unused or Costly Skills

| Command | Shows |
|---------|-------|
| `/context` | The size of the Skills listing in this session, after the budget is applied |
| `/doctor` | An estimate of the listing's cost and its biggest contributors |
| `/skill-doctor` (v2.1.252+) | Per-skill context cost and how often each skill is used; flags never-invoked skills and where to turn them off |
| `/skills` | Every skill; press `t` to sort by token count, `Space` to cycle visibility |
| `claude plugin details <name>` | A plugin's components and projected token cost |

When the listing exceeds its budget (1% of the context window by default), Claude Code drops descriptions — least-used skills first — which removes the words Claude matches on. Fix the cause (fewer or shorter entries) before raising the budget with `skillListingBudgetFraction`.

## Sharing and Retiring Skills

| Scope | How | Use for |
|-------|-----|---------|
| Project | Commit `.claude/skills/` | Workflows tied to one repository |
| Plugin | A `skills/` directory in a plugin, installed from a marketplace | Skills used across many repositories, versioned together |
| Managed | Managed settings | Organization-wide skills nobody should override |

Retire a skill in steps: `skillOverrides` `"name-only"` or `"off"` locally (`/skills` writes it to `.claude/settings.local.json`) to see if anyone misses it, then delete it in a reviewed commit and remove references to it from `CLAUDE.md` and docs.

## Syntax and Configuration

```json
{
  "skillOverrides": {
    "legacy-deploy-notes": "name-only",
    "old-release-check": "off"
  }
}
```

| Value | Listed to Claude | In `/` menu |
|-------|------------------|-------------|
| `"on"` (default) | Name and description | Yes |
| `"name-only"` | Name only | Yes |
| `"user-invocable-only"` | Hidden | Yes |
| `"off"` | Hidden | Hidden |

## Real-World Example

The orderdesk team's `java-review` triggered on "review my changes" but also on "explain this change to me", where a Must fix / Should fix report was unwanted. Five near-miss prompts reproduced it. Narrowing the description to "… Use when the user asks to review changes, a diff or work before committing" and re-running the ten prompts in fresh sessions fixed it. Separately, `/skill-doctor` showed an old `deploy-notes` skill had never been invoked; after a week as `"off"` with no complaints, it was deleted.

## Step-by-Step Walkthrough

1. Write five should-trigger and five should-not-trigger prompts.
2. Run each in a fresh session with the skill and with it `"off"`; record triggered yes/no and the result.
3. Grade results against a short checklist (did it cite `file:line`? did it run the test?).
4. Change one thing (usually the description), re-run, compare.
5. Monthly: `/skill-doctor`, retire unused skills, and check that commands and file names in each skill still exist.

## Common Mistakes

- Testing in the session where you wrote the skill.
- Only testing prompts that should trigger.
- Judging by one run — model output varies; use several prompts.
- Raising the listing budget instead of removing dead skills.
- Leaving skills that reference renamed classes, build commands or files.

## Security Considerations

- Running another team's plugin evals executes their plugin as you; review it first.
- Retiring a skill that contained `allowed-tools` reduces what runs without prompts — a security win, not just tidiness.
- Keep eval fixtures free of real customer data and credentials.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Skill triggers in testing but not for teammates | Personal skill with the same name overrides it, or their `skillOverrides` | Check `/skills` on their machine |
| Descriptions cut short | Listing over budget | Remove or name-only rarely used skills; shorten descriptions |
| `/skill-doctor` unavailable | Older version, Remote Control, or feature-flag fetching off | Run it in the terminal on v2.1.252+ |
| Results differ between runs | Normal model variation | Use more prompts; compare rates, not single runs |

## Trade-offs

| Approach | Benefit | Cost |
|----------|---------|------|
| Manual baseline checks | No setup | Slow, easy to skip |
| `claude plugin eval` | Repeatable, CI-friendly | Requires a plugin; uses real model sessions |
| skill-creator | Guided loop, description tuning | Plugin install; its own file format |

## Interview Takeaways

- Measure triggering and usefulness separately, against a baseline, in fresh sessions.
- `/skill-doctor`, `/context` and `/skills` show what skills cost; retire unused ones.
- Share project skills by committing them, cross-repo skills as plugins, mandatory ones through managed settings.

## Key Takeaways

- "It triggered" is not "it helped".
- Include should-not-trigger prompts.
- Every skill has an ongoing context cost; review it like any dependency.
- Keep skills in sync with the code they describe, or delete them.
