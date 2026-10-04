# Spring Security and JWT Interview Questions

**Module:** Interview Preparation · **Interview priority:** Core

## Definition

A question bank covering **Spring Security** (filter chain, authentication architecture, authorization, CSRF/CORS, sessions) and **JWT** (structure, validation, flow, refresh tokens, revocation) — by level and **Style**.

## Why It Matters

Candidates who list "Spring Security + JWT" on a résumé are asked to walk through the request flow filter by filter and to justify design choices (stateless, CSRF disabled, token storage, expiry). Shallow answers are easy to spot.

## How to Answer

- Describe the **request path**: filter chain → authentication → `SecurityContext` → authorization → controller.
- Distinguish **401 vs 403** and **authentication vs authorization** in every relevant answer.
- For JWT, cover **signature, expiry, storage, refresh and revocation** — not just "we generate a token".

Lessons: [Spring Security](../../security/spring-security-introduction/content.md), [Filter Chain](../../security/security-filter-chain/content.md), [Authentication Architecture](../../security/authentication-architecture/content.md), [JWT Structure](../../security/jwt-fundamentals/content.md), [JWT Flow](../../security/jwt-authentication-flow/content.md), [Refresh Tokens](../../security/access-and-refresh-tokens/content.md), [CORS](../../web-security/spring-cors/content.md), [CSRF](../../web-security/spring-csrf/content.md).

## Key Takeaways

- Filter chain first, controllers last; 401 = who are you, 403 = not allowed.
- JWT is a format; security comes from validation, short expiry, safe storage and revocation design.
