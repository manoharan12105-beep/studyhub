# Access Tokens, Refresh Tokens and Expiration — Practice

### P1. Sent with every request

**Difficulty:** Easy · **Type:** MCQ

Which token should accompany every API request?

- A) Refresh token
- B) Access token
- C) Both
- D) Neither; the session id

<details>
<summary>Answer</summary>

**Answer:** B) Access token

</details>

### P2. Stolen refresh token

**Difficulty:** Medium · **Type:** Scenario

An attacker steals a user's refresh token and uses it once before the user's app does. With rotation and reuse detection, what happens next?

<details>
<summary>Answer</summary>

The attacker receives new tokens and the stolen token is marked used. When the legitimate app later presents the same (now used) token, the server detects reuse, revokes the whole family — including the attacker's new refresh token — and the user must log in again. The attacker keeps access only until their short-lived access token expires.

</details>

### P3. Design the table

**Difficulty:** Medium · **Type:** Design

List the columns of a `refresh_token` table supporting rotation, reuse detection and per-device logout.

<details>
<summary>Answer</summary>

`id`, `token_hash` (unique), `user_id`, `family_id`, `device_name`/`user_agent`, `created_at`, `expires_at`, `used_at` (null until rotated), `revoked_at`, optionally `replaced_by_id` and `ip_address`. Index `token_hash` and `user_id`; clean up expired rows periodically.

</details>
