# OAuth2 and OpenID Connect Awareness — Practice

### P1. Which flow?

**Difficulty:** Easy · **Type:** MCQ

A nightly billing job must call the invoicing API with no user involved. Which OAuth2 grant fits?

- A) Authorization code with PKCE
- B) Client credentials
- C) Implicit
- D) Device code

<details>
<summary>Answer</summary>

**Answer:** B) Client credentials

</details>

### P2. Name the roles

**Difficulty:** Easy · **Type:** Conceptual

In "Log in to ShopApp with Google, then ShopApp's backend calls the ShopApp Orders API", identify the OAuth2/OIDC roles.

<details>
<summary>Answer</summary>

Resource owner: the user. Client: ShopApp (front end/backend). Authorization server / OpenID provider: Google. Resource server: the ShopApp Orders API (if it accepts Google-issued access tokens — more often the app issues its own tokens or uses its own identity provider after federating with Google).

</details>

### P3. Wrong token

**Difficulty:** Medium · **Type:** Debugging

A resource server rejects tokens with 401 "invalid audience" after a new SPA is added. What do you check?

<details>
<summary>Answer</summary>

That the SPA requests access tokens for the API (correct audience/resource or scope configuration in the identity provider) rather than sending its ID token, and that the resource server's expected audience matches the token's `aud` claim.

</details>
