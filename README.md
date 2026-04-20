# Prema

**A free mutual aid tool at [prema.red](https://prema.red)**

Post what you need. Post what you can give. No middleman. Just people.

Built and maintained by [The Red Party](https://theparty.red). Open to everyone regardless of political belief or party membership.

---

## What It Is

Prema (Sanskrit for *unconditional love*) is a community platform for mutual aid — the everyday practice of neighbors helping neighbors. You post what you can offer or what you need. Others respond. Real help happens. No money changes hands for services. No followers. No algorithm. No means test.

Local and global scopes: in-person help tied to a neighborhood, and remote skills available to anyone anywhere.

## Current Status

**In active development.** Full stack is working end-to-end on the private dev site. Public launch at prema.red is next.

---

## Features

### Community Board
- Post abilities and needs across local and global scopes
- Filter by category, search by keyword, sort by type
- Distance display based on your location (local posts)
- **Local categories:** Food, Cleaning, Transport, Housing, Healthcare, Infrastructure, Other
- **Global categories:** Tech/Code, Legal, Art/Design, Writing, Advice, Education, Comrade Support, Other

### Organizations
- Local and global org directory with search
- Full org pages with tabs: About, Announcements, Events, Needs & Offers, (Members — admin only)
- Request to join with intention statement
- RSVP to events (members only, with capacity tracking)

### Org Needs & Offers
- Members post needs and abilities tied to the org
- Attach posts to a specific event, or leave them general
- Private by default (members only) with an opt-in public toggle
- **One-click claim:** "I got this" spawns an inbox thread between claimer and poster — coordination can move off-platform
- Lifecycle: open → claimed → fulfilled (with unclaim if you flake)
- Open-needs counts shown on the tab and per event

### Messaging
- On-platform inbox — all first contact stays on Prema
- Thread-based conversations tied to posts
- Completion flow: mark as done → both confirm → unlocks thank you notes and vouching

### Profiles & Reputation
- Public profile: bio, location, avatar, active posts, completed helps, vouches, thank you notes
- Vouching system: only unlocked after both parties confirm a completed interaction
- Thank you notes: recipient chooses whether to display them

### Auth
- Sign up with 4-step onboarding + email verification via Resend
- Browse without an account — account required to post, respond, message, or claim
- Password reset end-to-end

### Moderation
- Report flag on posts, profiles, and orgs
- 5 reports triggers automatic takedown pending moderator review
- Reporter is never identified to the person being reported
- Platform admin dashboard: handle reports, ban/unban users, approve/reject org creation requests

---

## Tech Stack

### Frontend
- Vanilla HTML, CSS, JavaScript — no framework
- Single-page app — JS handles all routing and rendering

### Backend
- **Node.js 20 / Express 4** — API and auth
- **PostgreSQL 16** — database
- **Drizzle ORM** — schema management + tracked migrations
- **bcrypt** — password hashing (cost 12)
- **express-session** — httpOnly cookies, 30-day expiry
- **multer** — profile avatar uploads
- **Resend** — transactional email (verification, password reset)

### Infrastructure
- DigitalOcean droplet — Ubuntu 24.04 LTS, NYC region
- nginx — reverse proxy + static file serving
- Let's Encrypt SSL via certbot (auto-renewing)
- PM2 — process manager, auto-restart on crash and reboot
- Automated daily backups
- Both `prema.red` and `theparty.red` on the same droplet

---

## Design

Soviet propaganda poster aesthetic — warm and direct, not a tech product. Red crosshatch background, charcoal cards, parchment nav, gold accents.

- **Fonts:** Cormorant Garamond (display) + Jost (body) via Google Fonts
- **Colors:** `#BB0000` red · `#1C1810` charcoal · `#EDE0C4` parchment · `#C9A84C` gold
- No dark mode — the visual identity is intentional and fixed

---

## Project Layout

```
prema/
├── frontend/            # vanilla SPA — index.html, script.js, style.css
├── backend/
│   ├── server.js        # Express entry point
│   ├── routes/          # auth, posts, messages, users, orgs, admin, uploads
│   ├── db/
│   │   ├── schema.ts    # source of truth — edit this, then generate a migration
│   │   ├── migrations/  # Drizzle-generated SQL migrations
│   │   └── seed.js      # populate local dev database
│   └── drizzle.config.js
└── MASTER_CONTEXT.md    # deep context for contributors and sessions
```

Detailed contributor docs (setting up a dev environment, architecture, deployment workflow) live outside this README — see `MASTER_CONTEXT.md` for now, full docs coming in an Obsidian vault.

---

## What's Next

- [ ] Thank you notes and vouches flow — backend complete, not yet wired to frontend
- [ ] Admin dashboard CSS polish
- [ ] Public launch at prema.red (currently a coming-soon page)
- [ ] Notifications for new org needs
- [ ] Optional cross-post from org needs to the main board
- [ ] Multi-person / quantity claims for needs that want a crew

---

## Values

Prema does not tolerate intolerance. People or ideas that demean, exclude, or harm others based on who they are have no place here. Openness is not the same as allowing everything — a community built on love and care has no obligation to platform hate.

---

## Who Built This

The Red Party — [theparty.red](https://theparty.red)

---

*"From everyone with an ability, to everyone with a need."*
