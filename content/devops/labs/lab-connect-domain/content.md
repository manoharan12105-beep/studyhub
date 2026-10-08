# Lab 13 — Connect a Domain to the VPS

**Lab:** 13 · **Module:** Domain, DNS and HTTPS · **Verification:** Instruction only

> [!NOTE]
> Needs a domain you control. **Instruction only:** no domain or DNS change was made when this lab was written; DNS panels differ between providers, so the steps name the record, not the buttons.

## Objective

Point `api.your-domain` at your VPS with an A record, verify resolution, and serve the API through Nginx under that name.

## Prerequisites

- [Lab 12](../lab-nginx-reverse-proxy/content.md); a registered domain and access to its DNS settings.
- Lesson: [Domain, DNS and HTTPS](../../server-deployment/domain-dns-and-https/content.md).

In this lab `api.example.com` stands for your name and `203.0.113.10` for your server's IP.

## Scenario

The demo should be reachable at a memorable name, and HTTPS in Lab 14 needs one.

## Steps

### Step 1: Create the A record

In your DNS provider's panel add:

| Type | Name / Host | Value | TTL |
|------|-------------|-------|-----|
| A | `api` | `203.0.113.10` | 300 (5 minutes) |

Do not add an AAAA record unless your server has working IPv6.

### Step 2: Verify resolution

```bash
dig +short api.example.com A
dig +short api.example.com A @1.1.1.1
dig +short api.example.com AAAA
```

**Expected result:** the first two print your server IP (it may take a few minutes); the AAAA query prints nothing. On Windows, `nslookup api.example.com` works too.

### Step 3: Use the name in Nginx

Change `server_name` in `/etc/nginx/sites-available/taskapi` from the IP to `api.example.com`:

```bash
sudo sed -i 's/server_name .*/server_name api.example.com;/' /etc/nginx/sites-available/taskapi
sudo nginx -t && sudo systemctl reload nginx
```

### Step 4: Test

```bash
curl -s http://api.example.com/api/info
curl -s -H "Host: api.example.com" http://203.0.113.10/api/info
```

**Expected result:** both return the Task API's JSON. The second shows that Nginx chooses the site by the `Host` header.

## Verification Checklist

- ☐ `dig` returns your server IP from your resolver and from a public one.
- ☐ No stray AAAA record.
- ☐ `http://api.example.com/api/info` works.

## Common Mistakes

- Putting `http://` or a port into the record value — an A record holds only an IP.
- Creating the record for the wrong name (`@` vs `api`).
- Testing too early and "fixing" a correct record; wait for the TTL.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `dig` returns nothing | Record not saved, wrong zone, or the domain's NS records point to another DNS provider (`dig NS example.com`) |
| Old IP returned | Cached until the old TTL expires; query `@1.1.1.1` to compare |
| Name resolves but the Nginx welcome page appears | `server_name` mismatch or default site still enabled |
