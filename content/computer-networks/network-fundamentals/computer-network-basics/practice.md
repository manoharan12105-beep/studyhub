# What Is a Computer Network? — Practice

### P1. Internet or Web?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** Internet vs Web

Which of these does **not** need the World Wide Web?

- A) Loading a news site in a browser
- B) Calling a REST API with `curl https://api.example.com/users`
- C) Sending email from one mail server to another with SMTP
- D) Opening a web page on your company's intranet

<details>
<summary>Answer</summary>

**Answer:** C) Sending email from one mail server to another with SMTP

**Explanation:** SMTP is a separate application protocol that uses the Internet. A, B and D all use HTTP(S) and URLs, which is the Web.

</details>

### P2. Which identifier?

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** IP address, port

A server at `10.0.0.5` runs Nginx on port 443 and PostgreSQL on port 5432. A packet arrives with destination `10.0.0.5:5432`. Which part of the destination got it to the machine, and which part chose PostgreSQL?

<details>
<summary>Answer</summary>

The IP address `10.0.0.5` delivered it to the machine; the port `5432` told the operating system to hand it to the PostgreSQL process.

</details>

### P3. Why packets?

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** packet switching

A 10 MB file is sent as about 7,000 packets. One packet is corrupted on the way. What has to be resent, and why is that better than sending the file as one unit?

<details>
<summary>Answer</summary>

Only the damaged packet (TCP resends the missing bytes). If the file were one unit, any corruption would force the whole 10 MB to be resent, and the transfer would block a link for its full duration.

</details>

### P4. Count the networks

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** network of networks

You open a website from your phone on mobile data. Name at least three separately owned networks the packets cross.

<details>
<summary>Answer</summary>

For example: the mobile carrier's network, one or more transit/backbone ISP networks, and the hosting provider's (or CDN's) data-centre network. The Internet is these independent networks interconnected by routers that all speak IP.

</details>
