# Scenario and Troubleshooting Questions

**Module:** Interview Preparation · **Interview priority:** Core

## What Is It?

A [question bank](interview-questions.md) of production-style scenarios: "the system is slow", "users see stale data", "what happens if this component dies", "traffic is about to grow tenfold". Each answer combines several topics.

## Why It Matters

Scenario questions show whether you can **reason from symptoms to causes** and choose proportionate fixes — the skill interviewers most associate with engineers who have run real systems.

## Core Concept

### A method for troubleshooting answers

1. **Clarify the symptom:** who is affected, since when, how badly (all users or a slice)?
2. **Check what changed:** deploys, config, traffic, dependencies.
3. **Localise with data:** golden signals per service, slice by region/version/endpoint, traces for the slow hop, logs for details.
4. **Form and test a hypothesis:** the bottleneck or failure that explains the symptom.
5. **Mitigate first, then fix:** roll back, shed load, fail over — then the root cause.
6. **Prevent recurrence:** alerts, tests, capacity, design changes.

### A method for "what happens if" answers

Describe the immediate effect, how the system detects it, how it recovers (automatically or manually), what users experience meanwhile, and what data, if any, can be lost.

## Key Takeaways

- Symptom → change → localise → hypothesis → mitigate → fix → prevent.
- For failures: effect, detection, recovery, user experience, data loss.
- Mitigation (rollback, failover, shedding) comes before root-cause fixes during incidents.
