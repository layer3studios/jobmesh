# Nginx — subdomain routing

Production vhosts for the audience-per-subdomain architecture
(see `NAMING-CONVENTIONS.md` §17).

## What routes where

| Host | Upstream | Serves |
|---|---|---|
| `jobmesh.in` | Next.js `:3001` | Seeker site |
| `hire.jobmesh.in` | Next.js `:3001` | Employer ATS |
| `admin.jobmesh.in` | Next.js `:3001` | Internal admin |
| `apply.jobmesh.in` | Next.js `:3001` | Public apply + careers |
| `health.jobmesh.in` | Next.js `:3001` | Health/status |
| `api.jobmesh.in` | Express `:3000` | Backend API |
| `www.jobmesh.in` | — | 301 → `jobmesh.in` |
| anything else | — | 444 (connection closed) |

One Next.js process serves five hosts. Nginx forwards the `Host` header
untouched and `apps/frontend/src/middleware.ts` rewrites the path into the
matching route group.

> **`proxy_set_header Host $host;` is load-bearing.** Rewriting it to the
> upstream address would make every audience look like the seeker site to the
> middleware, silently collapsing the whole routing scheme.

## Install

```bash
sudo cp apps/nginx/jobmesh.conf /etc/nginx/sites-available/jobmesh.conf
sudo ln -sf /etc/nginx/sites-available/jobmesh.conf /etc/nginx/sites-enabled/jobmesh.conf
sudo rm -f /etc/nginx/sites-enabled/default   # its default_server would win
sudo nginx -t && sudo systemctl reload nginx
```

On distributions without `sites-available`, drop the file into
`/etc/nginx/conf.d/` instead — the `http` block already includes that directory.

## DNS

Both records point at the same EC2 instance:

| Type | Name | Value |
|---|---|---|
| `A` | `jobmesh.in` | *EC2 elastic IP* |
| `A` | `*.jobmesh.in` | *same EC2 elastic IP* |

The wildcard covers `hire`, `admin`, `apply`, `health` and `api`, so adding a
new subdomain needs no DNS change — only an Nginx `server_name` entry and a
middleware rule.

## SSL — wildcard certificate

A wildcard cert **cannot** use the HTTP-01 challenge. Let's Encrypt requires
DNS-01, which means proving control by writing a TXT record:

```bash
sudo certbot certonly \
  --agree-tos --email ops@jobmesh.in \
  --preferred-challenges dns \
  --manual \
  -d 'jobmesh.in' -d '*.jobmesh.in'
```

Certbot prints a `_acme-challenge.jobmesh.in` TXT value; add it at your DNS
provider, wait for propagation (`dig +short TXT _acme-challenge.jobmesh.in`),
then press Enter.

`--manual` means renewal is **not** automatic. For unattended renewal use the
DNS plugin for your provider, e.g.:

```bash
sudo certbot certonly \
  --dns-route53 -d 'jobmesh.in' -d '*.jobmesh.in'
```

Verify the renewal timer once installed:

```bash
sudo certbot renew --dry-run
systemctl list-timers | grep certbot
```

The config expects the standard certbot output paths:

```
/etc/letsencrypt/live/jobmesh.in/fullchain.pem
/etc/letsencrypt/live/jobmesh.in/privkey.pem
```

The HTTP redirect block leaves `/.well-known/acme-challenge/` unredirected and
served from `/var/www/certbot`, so apex HTTP-01 renewals keep working:

```bash
sudo mkdir -p /var/www/certbot
```

## Reload after any change

```bash
sudo nginx -t && sudo systemctl reload nginx
```

`nginx -t` parses the config and validates certificate paths. Never skip it —
`reload` on a broken config leaves the old workers running and the change
silently unapplied.

## Application processes

Nginx proxies to two long-running processes, both managed by pm2:

```bash
pm2 start apps/backend/src/server.js --name jobmesh-api      # :3000
pm2 start npm --name jobmesh-web -- start --prefix apps/frontend  # :3001
pm2 save
```

Neither should be exposed publicly — bind them to `127.0.0.1` and let the
security group allow only 80/443 from the internet.

## Troubleshooting

| Symptom | Cause |
|---|---|
| Every subdomain shows the seeker site | `Host` header not forwarded (see above) |
| `hire.jobmesh.in` 404s on every path | Next.js not running, or middleware not deployed |
| API calls fail with a CORS error | Origin not matched by `server.js`; check `CORS_ALLOWED_ORIGINS` |
| Logged in on `jobmesh.in`, logged out on `hire.` | `COOKIE_DOMAIN` unset in the backend `.env` |
| `ERR_TOO_MANY_REDIRECTS` on `www` | Both the HTTP and HTTPS `www` blocks missing/duplicated |
| Unknown subdomain reaches a real audience | `default_server` block removed, or `sites-enabled/default` still linked |
