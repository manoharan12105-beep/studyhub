# Certificates and Certificate Authorities — Practice

### P1. What the certificate holds

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** certificate contents

Which of these is **not** in a server's TLS certificate?

- A) The domain name
- B) The server's public key
- C) The server's private key
- D) The issuer's signature

<details>
<summary>Answer</summary>

**Answer:** C) The server's private key

</details>

### P2. Diagnose the warning

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** verification failures

Match each browser error to its cause: (a) `ERR_CERT_DATE_INVALID`, (b) `ERR_CERT_COMMON_NAME_INVALID`, (c) `ERR_CERT_AUTHORITY_INVALID`.

<details>
<summary>Answer</summary>

(a) Expired (or not yet valid) certificate — or a wrong system clock. (b) The hostname is not in the certificate's SANs (e.g. certificate for `www.example.com` used on `api.example.com`). (c) The chain does not lead to a trusted root — self-signed, private CA, or missing intermediate.

</details>

### P3. Wildcard

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** SAN matching

A certificate has SAN `*.example.com`. Is it valid for (a) `api.example.com`, (b) `example.com`, (c) `v1.api.example.com`?

<details>
<summary>Answer</summary>

(a) Yes. (b) No — the wildcard needs one label; add `example.com` as its own SAN. (c) No — a wildcard covers only one level.

</details>

### P4. Order the chain

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** chain of trust

Order from the certificate the server presents first to the one the client already trusts: root CA, `shop.example.com`, intermediate CA.

<details>
<summary>Answer</summary>

`shop.example.com` (leaf) → intermediate CA → root CA (in the client's trust store).

</details>
