# Network Security Fundamentals — Interview Questions

## Beginner

### Q1. What is the difference between authentication and authorization?

**Style:** Comparison

<details>
<summary>Answer</summary>

Authentication verifies identity — who you are (password, OTP, key, certificate). Authorization decides what an authenticated identity may do — which resources and actions (roles, permissions, ACLs). Authentication comes first. In HTTP, failed authentication is 401 and failed authorization is 403.

</details>

### Q2. What is the CIA triad?

<details>
<summary>Answer</summary>

Confidentiality (only authorised parties can read data — encryption), Integrity (data is not modified undetected — MACs, signatures) and Availability (systems remain accessible — redundancy, DDoS protection). Security controls are judged by which of these they protect.

</details>

## Intermediate

### Q3. What is defence in depth? Give an example for a web application.

<details>
<summary>Answer</summary>

Layering independent security controls so that the failure of one does not expose the system. For a web app: DDoS protection/CDN, a WAF, TLS at the load balancer, security groups that allow the app only from the LB and the database only from the app, application authentication and authorization, input validation, a least-privilege database user, encryption at rest, and monitoring/alerting.

</details>

### Q4. What is the principle of least privilege in networking?

<details>
<summary>Answer</summary>

Give every user, service and network path only the access it needs. Examples: the database port open only to the application subnet; the app's DB user without DDL rights; SSH reachable only from a bastion or VPN; service accounts scoped to specific APIs. It limits the blast radius of a compromise.

</details>

## Advanced

### Q5. What is zero trust, and how does it differ from a perimeter model?

**Style:** Comparison

<details>
<summary>Answer</summary>

The perimeter ("castle and moat") model trusts anything inside the corporate network or VPN. Zero trust trusts nothing by network location: every request is authenticated and authorized based on identity (user and device), context and policy, traffic is encrypted everywhere (often mTLS between services), and access is least-privilege and continuously verified. It limits lateral movement after a breach and fits cloud and remote work.

</details>
