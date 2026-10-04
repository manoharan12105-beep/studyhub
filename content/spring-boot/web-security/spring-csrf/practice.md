# CSRF and CSRF vs CORS — Practice

### P1. Disable or not?

**Difficulty:** Easy · **Type:** MCQ

In which application is it reasonable to disable CSRF protection?

- A) A Thymeleaf banking app with form login and sessions
- B) A REST API authenticating only with `Authorization: Bearer` tokens
- C) An SPA storing its JWT in a cookie
- D) An admin panel using HTTP sessions

<details>
<summary>Answer</summary>

**Answer:** B) A REST API authenticating only with `Authorization: Bearer` tokens

</details>

### P2. Attack scenario

**Difficulty:** Medium · **Type:** Scenario

A shop's `GET /account/delete?confirm=true` deletes the logged-in user's account (session cookie auth, CSRF enabled). Can an attacker exploit it? How?

<details>
<summary>Answer</summary>

Yes: CSRF protection does not cover GET. An attacker page can include `<img src="https://shop.example/account/delete?confirm=true">`; with SameSite=Lax the cookie is not sent on such subresource requests, but a top-level link click would send it. Fix: make it `DELETE`/`POST` with CSRF protection and re-authentication.

</details>

### P3. Explain the 403

**Difficulty:** Medium · **Type:** Debugging

A teammate's Postman `POST /orders` to a session-based app returns 403 even after logging in. Their GET requests work. Why?

<details>
<summary>Answer</summary>

The POST lacks a CSRF token. Postman must first obtain the token (e.g. from the `XSRF-TOKEN` cookie or a form page) and send it in the expected header/parameter. GET is not checked, which is why it works.

</details>
