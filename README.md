# SecureVulnApp

![Demo Image](./image.png)

## Overview
SecureVulnApp is a **full‑stack demonstration** of common web security flaws and their mitigations. It includes a React frontend and an Express/Node.js backend that can be run in two modes:
- **vulnerable** – deliberately insecure to showcase attacks such as IDOR, CSRF, XSS, rate‑limiting bypass, etc.
- **secure** – hardened using best‑practice middleware, configuration‑driven security headers, CSRF tokens, input validation, and role‑based access control.

The app is designed for:
- Security training and workshops.
- Automated security testing demos.
- Learning how to refactor legacy code into a maintainable, secure architecture.

## Features
- Centralised input validation (`backend/middleware/inputValidation.js`).
- Config‑driven security middleware (Helmet, rate‑limiter, CSRF).
- Auth flow with JWT, `AuthProvider` React context, and custom `AuthPage` UI.
- Red‑team routes for token harvesting, session simulation, and reset.
- Comprehensive error handling via `ErrorBoundary`.
- Dockerfile and `npm run dev` for quick local development.

## Installation
```bash
# Clone the repository
git clone <repo‑url>
cd SecureVulnApp

# Install dependencies (backend + frontend)
npm install            # installs root dependencies (concurrently, etc.)
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Set environment mode (choose one)
# For vulnerable mode (default):
cp .env.example .env
# Edit .env if needed, ensure APP_MODE=vulnerable

# Run the app
npm run dev
```
The backend runs on **http://localhost:5000** and the frontend on **http://localhost:3000**.

## Usage
1. Open the app in a browser.
2. Register or log in using the Auth page.
3. Switch between *vulnerable* and *secure* modes via the `/mode` endpoint.
4. Explore the demo pages:
   - **IDOR** (`/idor`) – shows unauthorized data access.
   - **CSRF** (`/csrf`) – demonstrates token handling.
   - **Red‑Team** (`/redteam`) – harvest tokens and view logs.
5. Observe how security headers, rate‑limiting, and CSRF protections change based on the selected mode.

## Topics / Keywords (for GitHub)
- **web security**
- **OWASP Top 10**
- **IDOR**
- **CSRF**
- **XSS**
- **rate limiting**
- **helmet**
- **express-validator**
- **React Context**
- **JWT authentication**
- **secure coding patterns**

## Contributing
Feel free to open issues or submit pull requests. Please follow these guidelines:
- Keep the `backend/middleware` logic config‑driven.
- Add unit tests for any new security feature.
- Update the README and documentation when adding new demo pages.

## License
MIT © 2024‑2026
