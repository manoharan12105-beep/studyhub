# git bisect: Finding the Commit That Broke Something — Interview Questions

## Beginner

### Q1. What does `git bisect` do?

**Style:** What

<details>
<summary>Answer</summary>

It performs a binary search through commit history between a known good and a known bad commit, checking out the midpoint each time you mark a commit good or bad, until it identifies the first bad commit — the one that introduced the problem.

</details>

## Intermediate

### Q2. How many steps does bisect need for 1,000 commits?

**Style:** Calculation

<details>
<summary>Answer</summary>

About log₂ 1000 ≈ 10 tests, because each test halves the remaining range.

</details>

### Q3. How do you automate a bisect?

**Style:** How

<details>
<summary>Answer</summary>

`git bisect start <bad> <good>` then `git bisect run <script>`. The script must exit 0 if the commit is good, 1–127 (except 125) if bad, and 125 if the commit can't be tested; Git runs it at each step and reports the first bad commit. Keep the script outside the repository if older commits don't contain it.

</details>

## Advanced

### Q4. During bisect, a commit doesn't compile because of an unrelated problem. What do you do?

**Style:** Scenario

<details>
<summary>Answer</summary>

Mark it with `git bisect skip` (or exit 125 from the run script). Git picks a nearby commit instead. If the skipped commits are adjacent to the culprit, Git may report a small set of possible first-bad commits rather than one.

</details>

### Q5. How do commit practices affect bisect?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Bisect needs commits that build and pass unrelated tests. Atomic commits (code with its tests, each buildable) make every step testable and the culprit small; huge mixed commits make the result vague; broken intermediate commits force many skips. Squash merges make each PR one testable unit but coarser.

</details>
