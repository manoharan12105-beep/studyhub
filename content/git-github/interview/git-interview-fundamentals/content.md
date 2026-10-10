# Git Interview Questions: Fundamentals

**Module:** Git Interview Preparation · **Interview priority:** Core

## Learning Objectives

- Answer the beginner Git questions that open almost every technical interview.
- Structure each answer: direct answer → explanation → example → common misconception.
- Recognise the follow-up an interviewer is likely to ask next.

## What Is It?

This topic collects **beginner-level** interview questions: version control, Git vs GitHub, the three areas, basic commands, branches and simple merges. Intermediate comparisons are in [Command Comparisons](../git-interview-command-comparisons/content.md), deep questions in [Advanced Questions](../git-interview-advanced/content.md), and practical "what would you do" questions in [Scenario Questions](../git-interview-scenarios/content.md).

## Why It Matters

Fundamentals questions are short but revealing: an interviewer hears in ten seconds whether you understand Git's model or only memorised commands. Precise, calm answers here earn trust for the harder questions.

## How to Answer Git Questions

```text
1. Direct answer        one or two sentences that would be enough on their own
2. Explanation          the mechanism (areas, pointers, commits)
3. Example              a command or a tiny scenario from your own project
4. Trap / follow-up     the misconception you avoid, or the next question you anticipate
```

Example — "What is a branch?":

1. "A branch is a movable pointer to a commit."
2. "It's a ref file containing a commit id; when I commit, Git moves the current branch to the new commit."
3. "`git switch -c feature/report` creates one instantly."
4. "It's not a copy of the code — that's why branching in Git is cheap."

## Key Takeaways

- Lead with the one-sentence answer; then explain the mechanism.
- Use your own project (gradebook, a Spring Boot app) as the example.
- Name the common misconception — it shows depth.
- Practise saying the answers aloud; the flashcards in this subject help.

## Related Topics

- [What Is Version Control?](../../vcs-fundamentals/what-is-version-control/content.md)
- [The Three Areas of Git](../../basic-workflow/three-areas-of-git/content.md)
- [Command Comparisons](../git-interview-command-comparisons/content.md)
