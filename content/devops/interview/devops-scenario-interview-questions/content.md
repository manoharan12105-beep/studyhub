# DevOps Scenario and Troubleshooting Questions

**Module:** Interview Preparation · **Interview priority:** Frequently asked

## What Is It?

Scenario, debugging and production-failure questions: the interviewer describes a symptom ("Nginx returns 502", "the container keeps restarting", "data disappeared after a redeploy") and expects a calm, ordered investigation and a precise fix.

## Why It Matters

These questions test whether you have really run software in production. A structured answer — evidence first, one change at a time, prevention at the end — is what distinguishes a candidate who has deployed something from one who has only read about it.

## Core Concept

Answer every scenario in four parts:

```text
1. Hypotheses   What could cause this symptom? (name 2–3)
2. Evidence     Which commands/logs separate them? (docker compose ps, logs, ss, df, curl)
3. Fix          The smallest change that removes the cause, then verify.
4. Prevention   What stops it from happening again? (health checks, alerts, config validation)
```

Work outside-in: DNS → network/firewall → Nginx → container state → application logs → database → resources (disk, memory).

## Key Takeaways

- Never start with "restart it"; start with evidence.
- Quote the exact error line you would expect — it shows experience.
- End with prevention: monitoring, automation, safer defaults.
