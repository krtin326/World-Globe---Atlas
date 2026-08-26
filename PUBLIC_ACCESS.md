# Sharing World Globe beyond your own PC

By default the app is served at `http://localhost:8080`, which only *this*
computer can open. `serve.py` (Flask) changes that — it binds to every network
interface, so other devices can load the globe too. There are two levels of
"public", and they are very different in what they expose.

---

## Level 1 — your own network (phones, tablets, other laptops)

This is the safe, everyday option: anyone on the **same Wi-Fi / LAN** can open
the globe. Nothing is exposed to the internet.

```bash
python serve.py
```

(or `py serve.py` — if Flask is missing, run `pip install -r requirements.txt`
first.)

It prints something like:

```
On this PC:      http://localhost:8080/
On the network:  http://192.168.1.35:8080/   (share this)
```

On another device on the same network, open that **`http://192.168.1.35:8080/`**
address (your number will differ). To change the port: `PORT=5000 python serve.py`.

### If other devices can't connect

1. **Same network?** Both devices must be on the same Wi-Fi. Phone "mobile data"
   or a "Guest" Wi-Fi that isolates clients will not work.
2. **Windows Firewall.** The first time Python listens, Windows usually pops up
   "Allow Python to communicate on these networks?" — tick **Private networks**
   and allow it. If you dismissed it, you can add the rule from an
   **Administrator** PowerShell:
   ```powershell
   New-NetFirewallRule -DisplayName "World Globe 8080" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8080
   ```
   Remove it later with:
   ```powershell
   Remove-NetFirewallRule -DisplayName "World Globe 8080"
   ```
3. **Right IP.** Use the `On the network:` address the server prints, not
   `localhost` (which always means "this device").

---

## Level 2 — the whole internet (anyone, anywhere)

Your home PC has no public address of its own, so you can't just "share a link"
without help. The clean way is a **tunnel**: a service gives you a public URL and
forwards it to your local server. You do **not** open ports on your router, and
you can shut it off anytime by stopping the tunnel.

### Easiest: the one-command launcher

`cloudflared` is already installed. From this folder, run:

```powershell
powershell -ExecutionPolicy Bypass -File serve-public.ps1
```

It starts the server *and* the tunnel together and prints a public
`https://<random>.trycloudflare.com` link that anyone on any network can open.
**Keep the window open** — the link dies when you close it (Ctrl+C stops both).
Each run gives a **new** random URL.

If you'd rather run the two pieces by hand, start `python serve.py` in one
terminal, then in a second terminal:

### Option A — Cloudflare Tunnel (no account needed for a quick link)

```bash
cloudflared tunnel --url http://localhost:8080
```

It prints a public `https://<random>.trycloudflare.com` URL. Anyone can open it
while both the tunnel and `serve.py` are running. Install `cloudflared` from
Cloudflare's site (it's a single executable).

### Option B — ngrok

```bash
ngrok http 8080
```

Prints a public `https://<random>.ngrok-free.app` URL. Free ngrok needs a
one-time signup for an authtoken.

### Before you expose it to the internet, know this

- **It's read-only and static** — the server only hands out the site's files and
  blocks path-traversal, so there's no data to tamper with. But it's Flask's
  development server, meant for convenience, not a hardened production host.
- **No real login.** The main globe has no accounts at all. The `/atlas/` site's
  login is **client-side only** (see the atlas notes) — it gates the UI, it does
  **not** protect anything on the server. Treat everything served as public.
- **A tunnel URL is guessable-public.** While it runs, anyone with the link can
  visit. Stop the tunnel when you're done.
- **Licensing still applies** if you distribute the data files — see
  [docs/SOURCES.md](docs/SOURCES.md) (especially the OSM/ODbL roads note).

### Making it permanently public

For an always-on public site, don't run it from your PC — deploy the static
files to a host built for it: **Cloudflare Pages**, **GitHub Pages**, **Netlify**
or **Vercel**. The app is pure static files (HTML/JS/CSS/JSON), so any static
host works; you'd upload the folder (minus `node_modules/` and `data/raw/`) and
get a real domain with HTTPS. That's outside the scope of `serve.py`, which is
for serving from this machine.
