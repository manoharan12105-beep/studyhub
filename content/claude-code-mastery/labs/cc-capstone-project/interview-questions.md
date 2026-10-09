# Capstone: Ship a Safe Fix to orderdesk — Interview Questions

## Beginner

### Q1. Walk me through how you fixed BUG-101.

**Style:** Scenario

<details>
<summary>Answer</summary>

I reproduced both symptoms with failing tests: a GET of an order without a discount code returned 500 because `PriceCalculator` called `trim()` on a null code, and a failed create still stored the order because `create()` wasn't transactional. I fixed the calculator (null or blank means no discount), made `create()` transactional so the failure rolls back the save, kept every existing test unchanged, and showed the full build passing.

</details>

### Q2. Why did you set up CLAUDE.md, permissions and hooks before fixing anything?

**Style:** Why

<details>
<summary>Answer</summary>

So every later session started with the right facts (build commands, conventions, definition of done) and the right limits (no secrets, no edits to applied migrations, no force pushes, asks before commits). Setting them up first meant the fixes were done under those rules rather than retrofitted.

</details>

## Intermediate

### Q3. How did you know the SQL injection fix worked?

**Style:** How

<details>
<summary>Answer</summary>

A MockMvc test stored orders, sent `x' OR '1'='1` as the email and expected an empty list. It failed on the concatenated query (it returned stored orders) and passed after switching to a `?` parameter. Without stored rows, the test would have passed before the fix too.

</details>

### Q4. What did the AI reviewers get wrong, and how did you handle it?

**Style:** Debugging

<details>
<summary>Answer</summary>

(Answer from your own review log.) A good answer names a specific rejected finding and the evidence — for example a cited line that didn't contain the described code, a "tests pass" claim from a reviewer that can't run tests, or a spec conflict (409 vs idempotent 200 for repeated pay requests) that needed the requirement, not the reviewer, to decide.

</details>

## Advanced

### Q5. If you had to let Claude work on orderdesk unattended overnight, what would you change?

**Style:** Design

<details>
<summary>Answer</summary>

Run it in a worktree or container on its own branch; keep permissions to the build and file edits; deny network and pushes; a Stop hook or `/goal` that requires a green build; commit per verified step with a plan file; turn and budget limits; and a morning review of the diff and evidence before anything merges. No deploys, no access to secrets.

</details>

### Q6. What would you tell a team adopting Claude Code based on this project?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Start with a specific CLAUDE.md and project permissions; require reproduction tests and build output as evidence; keep reviewers read-only and validate their findings; enforce must-hold rules with hooks and server-side protections, not instructions; keep humans on commits, pushes, merges and deploys; and measure rework and defects to decide what to keep.

</details>
