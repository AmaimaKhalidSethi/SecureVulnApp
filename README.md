# SecureVulnApp

![Demo Image](./image.png)

> A full-stack **attack-and-defense demo** that runs every vulnerability in two modes: **vulnerable** (attack succeeds) and **secure** (attack is blocked). Built with React + Express/Node.js + MongoDB.

---

## Table of Contents

1. [What This App Does](#what-this-app-does)
2. [Tech Stack](#tech-stack)
3. [Prerequisites](#prerequisites)
4. [Setup & Installation](#setup--installation)
5. [Environment Variables](#environment-variables)
6. [Running the App](#running-the-app)
7. [Attack Demos — Full Walkthrough](#attack-demos--full-walkthrough)
   - [Stored XSS](#1-stored-xss--comments-page)
   - [Reflected XSS](#2-reflected-xss--search-page)
   - [CSRF](#3-csrf--forged-requests)
   - [IDOR](#4-idor--broken-object-level-authorization)
   - [Brute Force / Account Lockout](#5-brute-force--account-lockout)
   - [Missing Security Headers](#6-missing-security-headers--clickjacking)
   - [Attack Chain](#7-attack-chain--end-to-end-simulation)
8. [Switching Modes](#switching-modes)
9. [Architecture Overview](#architecture-overview)
10. [Security Controls Reference](#security-controls-reference)
11. [Known Intentional Vulnerabilities](#known-intentional-vulnerabilities)

---

## What This App Does

SecureVulnApp is a controlled lab environment that demonstrates OWASP Top 10 vulnerabilities. Every attack page has two states:

- **Vulnerable mode** — the attack works exactly as it would in a real misconfigured app. You see the payload execute, the data leak, or the forged request succeed.
- **Secure mode** — the same attack is blocked by the countermeasure being demonstrated. The UI shows you what was blocked and why.

The mode is toggled via the sidebar and triggers a live server switch — no separate apps to manage.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Axios |
| Backend | Node.js, Express 5, JWT, cookie-parser |
| Database | MongoDB via Mongoose |
| Security | Helmet.js, express-rate-limit, express-validator, express-mongo-sanitize, DOMPurify, bcryptjs |
| Dev tooling | nodemon (auto-restarts when `.env` changes) |

---

## Prerequisites

- **Node.js** v18 or higher
- **MongoDB** running locally on port `27017` (or a MongoDB Atlas URI)
- **npm** v9+

Check your versions:
```bash
node --version   # should be v18+
mongod --version # or use Atlas
```

---

## Setup & Installation

```bash
# 1. Clone the repo
git clone https://github.com/AmaimaKhalidSethi/SecureVulnApp.git
cd SecureVulnApp

# 2. Install backend dependencies
cd backend
npm install

# 3. Install frontend dependencies
cd ../frontend
npm install

# 4. Create your .env file (backend only)
cd ../backend
cp .env.example .env   # then edit it — see Environment Variables below
```

---

## Environment Variables

Create `backend/.env` with the following. The file is gitignored — never commit it.

```env
# Required
APP_MODE=vulnerable          # start in vulnerable mode for demos; switch to secure via sidebar
JWT_SECRET=<random-64-char-string>   # generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
MONGO_URI=mongodb://localhost:27017/securevulnapp

# Optional
PORT=5000
ADMIN_KEY=<any-secret-string>        # protects the mode-switch API endpoint
ENABLE_REDTEAM=true                  # enables /api/redteam routes for token harvesting demo
NODE_ENV=development
```

**Generate a strong JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> ⚠️ The server will refuse to start if `JWT_SECRET` is missing or shorter than 32 characters.

---

## Running the App

Open **two terminals** — one for backend, one for frontend.

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev          # starts with nodemon on port 5000
```

You should see:
```
⚙️  App running in [VULNERABLE] mode
✅ MongoDB connected: localhost
🚀 Server running on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm start            # starts React dev server on port 3000
```

Open **http://localhost:3000** in your browser.

---

## Attack Demos — Full Walkthrough

Each demo below explains: what the vulnerability is, how to trigger it, and what the fix does.

---

### 1. Stored XSS — Comments Page

**Route:** `/xss`

**What it is:** Cross-Site Scripting (XSS). An attacker submits a comment containing a JavaScript payload. If the server stores it raw and the frontend renders it as HTML, the script executes in every visitor's browser.

**How to trigger it (Vulnerable Mode):**

1. Make sure the mode badge shows **VULNERABLE**.
2. Go to the Comments page (`/xss`).
3. In the comment box, type:
   ```
   <img src=x onerror="alert('XSS: ' + document.cookie)">
   ```
4. Submit. The alert fires immediately — and will fire again for every user who loads the page.

**Why it works:** In vulnerable mode, `config.input.sanitizeInputs = false`, so `commentController.js` stores the raw HTML string directly in MongoDB. The frontend uses `dangerouslySetInnerHTML` to render it — the browser parses it as live HTML and executes the `onerror` handler.

**The fix (Secure Mode):**

Switch to **SECURE** mode and try the same payload. The comment is saved but the script never runs.

In secure mode, `commentController.js` runs the content through DOMPurify before storage:
```js
storedContent = DOMPurify.sanitize(content);
// <img src=x onerror="alert(...)"> becomes <img src="x">
// The onerror attribute is stripped entirely
```
The frontend also renders it as a plain text node (not raw HTML), adding a second layer of defense.

---

### 2. Reflected XSS — Search Page

**Route:** `/search`

**What it is:** Reflected XSS. The server echoes user input back into the HTTP response without encoding it. Unlike stored XSS, the payload isn't saved — it travels in the URL and executes immediately.

**How to trigger it (Vulnerable Mode):**

1. Go to the Search page (`/search`).
2. Click the quick-fill button: `<img src=x onerror="alert(1)">` — or type it manually.
3. Press Search.
4. The alert fires because the search page renders `result.searchedFor` using `dangerouslySetInnerHTML`.

**The fix (Secure Mode):**

In secure mode, the server HTML-encodes the reflected value before sending it:
```js
searchedFor = rawQuery
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');
```
The frontend also renders it as `{result.searchedFor}` (text node) rather than raw HTML.

---

### 3. CSRF — Forged Requests

**Route:** `/csrf`  
**Attack demo file:** `attack-demo/evil.html`

**What it is:** Cross-Site Request Forgery. An attacker tricks a logged-in user into visiting a malicious page. That page silently fires HTTP requests to the real app using the victim's session credentials — transferring money, changing their email, or deleting their account.

**How to trigger it (Vulnerable Mode):**

1. Register and log in via the app sidebar.
2. Open `attack-demo/evil.html` directly in the same browser (File → Open, or serve it via a local server).
3. Click **Launch CSRF Attack**.
4. Watch the attack log — you'll see `✅ ATTACK SUCCEEDED` for the transfer and email-change requests.

This works because in vulnerable mode, `verifyCsrfToken` is skipped (`config.input.sanitizeInputs = false`), so the server accepts any POST with no CSRF token.

**The fix (Secure Mode):**

In secure mode, every state-changing request (`/transfer`, `/change-email`, `/change-password`, `/delete-account`) requires a valid `X-CSRF-Token` header:

1. The frontend fetches a token from `GET /api/user/csrf-token` (requires a valid JWT).
2. The token is tied to the user's session ID.
3. Every POST/PUT/DELETE sends it in the `X-CSRF-Token` header.
4. The evil.html page cannot obtain this token (it runs on a different origin and has no JWT) — all four attacks are blocked with `403 Forbidden`.

Additionally, cookies are set with `SameSite: strict`, which prevents the browser from attaching them to cross-origin requests at all.

**Run the demo again in secure mode** — the attack log will show `🔒 ATTACK BLOCKED` on all four requests.

---

### 4. IDOR — Broken Object Level Authorization

**Route:** `/idor`

**What it is:** Insecure Direct Object Reference. The app uses user IDs directly in URLs (`/api/users/:id`). If the server doesn't check whether the requesting user *owns* that ID, any logged-in user can read, update, or delete any other user's data just by changing the ID.

**How to trigger it (Vulnerable Mode):**

1. Log in as any user.
2. Go to the IDOR page — it loads a list of all registered users (which is itself a vulnerability: the user list is public in vulnerable mode).
3. Click any user ID that isn't yours.
4. Click **Read Profile** — you get their data with a warning: `⚠️ IDOR: accessed user X with different token`.
5. Try **Update Profile** with `{"username": "hacked"}` — it saves.
6. Try **Delete** — it deletes them.

**The fix (Secure Mode):**

In secure mode, `config.data.enforceOwnership = true`. The controller checks:
```js
if (!isOwner(req, targetId) && req.user.role !== 'admin') {
  return res.status(403).json({ error: 'Access denied — you can only view your own profile' });
}
```

Try the same attack — every request to a different user's ID returns `403`.

---

### 5. Brute Force / Account Lockout

**Route:** `/brute`

**What it is:** Automated password guessing. Without rate limiting or account lockout, an attacker can try thousands of passwords against a login endpoint until one works.

**How to trigger it (Vulnerable Mode):**

1. Register an account with email `hacker@test.com` and any password.
2. Go to the Brute Force page (`/brute`).
3. Enter `hacker@test.com` as the target email.
4. Click **Run Brute Force** — it cycles through 30 common passwords at 200ms intervals.
5. In vulnerable mode, all 30 attempts go through — no rate limit, no lockout.

**The fix (Secure Mode):**

Two mechanisms activate in secure mode:

- **Rate limiting:** `authLimiter` allows only 10 requests per 15-minute window per IP. After 10 attempts the endpoint returns `429 Too Many Requests`.
- **Account lockout:** After 5 consecutive failed logins, the account is locked for 15 minutes. Even if rate limiting is bypassed (e.g. from many IPs), a single account can't be hammered.

Run the demo in secure mode — the brute force stops at attempt 10 with a `429` response, and the attack stats show all subsequent requests blocked.

---

### 6. Missing Security Headers / Clickjacking

**Route:** `/headers`  
**Attack demo file:** `attack-demo/clickjack.html`

**What it is:** When security headers like `X-Frame-Options`, `Content-Security-Policy`, and `Strict-Transport-Security` are missing, the app is vulnerable to clickjacking (embedding in an iframe to trick users into clicking things), MIME-type sniffing attacks, and protocol downgrade attacks.

**How to trigger it (Vulnerable Mode):**

1. Open `attack-demo/clickjack.html` in your browser.
2. The app loads inside an iframe — this is clickjacking. An attacker overlays invisible buttons on top.
3. Go to `/headers` in the app and open DevTools (F12 → Network → Response Headers) — you'll see none of the standard security headers are present.

**The fix (Secure Mode):**

In secure mode, Helmet.js sets all of the following:

| Header | Value | Protects Against |
|---|---|---|
| `X-Frame-Options` | `DENY` | Clickjacking |
| `Content-Security-Policy` | `default-src 'self'` | XSS, data injection |
| `Strict-Transport-Security` | `max-age=31536000` | Protocol downgrade |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Data leakage via Referer |

Open `clickjack.html` in secure mode — the iframe is blocked. Check DevTools and all headers are present.

---

### 7. Attack Chain — End-to-End Simulation

**Route:** `/chain`

This page demonstrates a realistic multi-step attack where earlier vulnerabilities compound into a full account takeover:

1. **Recon** — IDOR exposes the full user list and profile data.
2. **Credential theft** — XSS payload stored in a comment harvests JWTs from other users' browsers and exfiltrates them to `/api/redteam/collect`.
3. **Account takeover** — The stolen JWT is used directly to call `/api/user/change-email` with an attacker-controlled address.
4. **Persistence** — Password reset flow goes to attacker's email; victim is locked out.

Run each phase in sequence using the Attack Chain page, then switch to secure mode and repeat — each phase is individually blocked.

---

## Switching Modes

The mode toggle is in the left sidebar. Clicking **Vulnerable** or **Secure** sends a `POST /api/mode/set` request which rewrites `backend/.env` and triggers a nodemon restart.

> The server restarts automatically because `nodemon.json` watches `.env` for changes.

After clicking, the sidebar shows `⏳ Switching...` and polls the server until it comes back up with the new mode active (up to ~9 seconds). The mode badge in the sidebar updates when the switch completes.

**If the server doesn't auto-restart** (e.g. you ran `node server.js` instead of `npm run dev`), you'll see a warning in the sidebar. Restart the backend manually.

---

## Architecture Overview

```
SecureVulnApp/
├── backend/
│   ├── config/
│   │   ├── appConfig.js          # loads the correct mode config at startup
│   │   ├── db.js                 # MongoDB connection
│   │   └── modes/
│   │       ├── vulnerable.js     # all protections OFF
│   │       └── secure.js         # all protections ON
│   ├── controllers/
│   │   ├── authController.js     # register, login, getProfile
│   │   ├── commentController.js  # XSS demo — store/search comments
│   │   ├── profileController.js  # IDOR demo — CRUD on users
│   │   └── userController.js     # CSRF demo — sensitive actions
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT verify + bypass for vulnerable mode
│   │   ├── csrfMiddleware.js     # CSRF token issue + verify
│   │   ├── helmetConfig.js       # security headers ON/OFF per mode
│   │   ├── inputValidation.js    # express-validator rules
│   │   ├── rateLimitMiddleware.js # rate limiters per endpoint type
│   │   ├── sanitizeMiddleware.js  # mongo-sanitize
│   │   └── securityLogger.js     # detects + logs injection/XSS patterns
│   ├── routes/
│   │   ├── auth.js               # /api/auth
│   │   ├── comments.js           # /api/comments
│   │   ├── logsRoutes.js         # /api/logs (admin only)
│   │   ├── modeRoutes.js         # /api/mode (mode toggle)
│   │   ├── profileRoutes.js      # /api/users (IDOR demo)
│   │   ├── redteamRoutes.js      # /api/redteam (token harvesting)
│   │   └── userRoutes.js         # /api/user (CSRF demo targets)
│   └── server.js                 # Express app entry point
│
├── frontend/
│   └── src/
│       ├── api/axiosConfig.js    # Axios instance with cookie credentials
│       ├── context/
│       │   ├── AuthContext.js    # login state, user object
│       │   └── SecurityContext.js # current mode, polling
│       └── pages/
│           ├── CommentsPage.jsx   # Stored XSS
│           ├── SearchPage.jsx     # Reflected XSS
│           ├── CsrfDemoPage.jsx   # CSRF
│           ├── IdorDemoPage.jsx   # IDOR
│           ├── BruteForceDemo.jsx # Brute force / rate limiting
│           ├── HeadersDemo.jsx    # Security headers / clickjacking
│           ├── AttackChainPage.jsx # Multi-step attack
│           └── SecurityLogsPage.jsx # Live attack log viewer
│
└── attack-demo/
    ├── evil.html        # CSRF demo — simulates evil.com
    └── clickjack.html   # Clickjacking demo — embeds app in iframe
```

---

## Security Controls Reference

| Control | Vulnerable Mode | Secure Mode | Where Implemented |
|---|---|---|---|
| Password hashing | Plaintext | bcrypt (10 rounds) | `authController.js` |
| JWT expiry | 1 day | 15 minutes | `config/modes/` |
| JWT enforcement | Bypassed | Required on all protected routes | `authMiddleware.js` |
| Input validation | Off | express-validator rules | `inputValidation.js` |
| NoSQL sanitization | Off | express-mongo-sanitize | `sanitizeMiddleware.js` |
| XSS sanitization | Off | DOMPurify (server-side) | `commentController.js` |
| CSRF tokens | Not checked | UUID token, session-bound, 1hr TTL | `csrfMiddleware.js` |
| Rate limiting (global) | Off | 200 req / 15 min | `rateLimitMiddleware.js` |
| Rate limiting (auth) | Off | 10 req / 15 min | `rateLimitMiddleware.js` |
| Account lockout | Off | 5 failures → 15 min lock | `authController.js` |
| CORS | Allow all origins | Allow localhost:3000 only | `server.js` |
| Security headers | None | Full Helmet.js suite | `helmetConfig.js` |
| Object-level auth | Off | Owner-only + admin override | `profileController.js` |
| Error messages | Verbose (stack traces) | Generic messages only | `appConfig.js` |
| Role assignment | Client-controlled | Server always assigns 'user' | `authController.js` |

---

## Known Intentional Vulnerabilities

The following are **deliberate** vulnerabilities present only in vulnerable mode for teaching purposes. They are not bugs.

- **Plaintext password storage** — demonstrates CWE-256. Passwords written to MongoDB as raw strings.
- **JWT bypass** — `enforceJwt: false` injects `req.user = { id: 'bypass', role: 'user' }` without any token check.
- **Admin self-promotion** — the `role` field in the registration request body is accepted as-is (CWE-269).
- **Object injection login bypass** — sending `{"password": {"$gt": ""}}` satisfies the Mongoose query in vulnerable mode (CWE-943).
- **Verbose errors** — stack traces and MongoDB error details returned in `500` responses (CWE-209).
- **JWT 999-day expiry** — was present in an earlier version; reduced to 1d to limit credential exposure during lab sessions.

These vulnerabilities are annotated with `// ⚠️ DELIBERATE VULNERABILITY` comments in the source code.

---

## License

MIT © 2026
ENDOFFILE