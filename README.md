# QuickFolio (Flask Full-Stack Portfolio Platform)

QuickFolio is a full-stack developer portfolio platform built with Flask, SQLite, and Vanilla JavaScript.
It supports portfolio creation, resume editing and PDF export, public publishing, analytics, chatbot assistance,
billing workflows, admin moderation, and production-oriented security/SEO hardening.

## Status

- Brand: QuickFolio
- Stack: Flask + SQLite + Vanilla JS
- Auth: Email/password + optional OAuth providers + password reset code flow
- Resume: Role-targeted suggestions + PDF generation
- Public pages: SEO metadata + structured data + sitemap/robots
- Security: Response hardening headers + cookie hardening + rate limiting

## Core Capabilities

### Portfolio Builder

- Full visual builder with section editing and live preview
- Reorder and visibility controls for portfolio sections
- Theme and typography customization
- Public publishing with unique slug URLs

### Resume Editor and Export

- Multiple resume layouts
- Inline editing and section controls
- Export polished PDF resumes
- Role-targeted tailoring with match scoring

### Public Portfolio Experience

- Public pages at `/p/<slug>`
- Recruiter-focused viewing mode support
- Contact form with persistence
- Optional portfolio chatbot assistance

### Analytics

- View events and traffic sources
- UTM-aware campaign/source aggregation
- Contact activity insights
- Core Web Vitals collection and dashboard usage

### Billing and Plans

- Plan catalog and checkout workflow
- Subscription lifecycle controls
- Payment method and invoice records

### Admin Moderation

- Review and moderate submitted templates
- Manage user accounts (deactivate/reactivate/delete)
- Platform-level overview and governance endpoints

## Implemented Production Hardening

### Security

- Secure response headers in Flask `after_request`, including:
  - `Content-Security-Policy`
  - `X-Content-Type-Options`
  - `Referrer-Policy`
  - `X-Frame-Options`
  - `Permissions-Policy`
  - `Cross-Origin-Opener-Policy`
  - `Cross-Origin-Resource-Policy`
  - `Strict-Transport-Security` (when HTTPS)
- Auth cookies set via centralized helper with:
  - `HttpOnly`
  - `SameSite=Lax`
  - `Secure` when request/proxy indicates HTTPS (or `COOKIE_SECURE` enabled)
- Production secret handling:
  - Uses `SECRET_KEY` from environment
  - Raises startup error when production mode is enabled without `SECRET_KEY`
- Request abuse protection:
  - In-memory rate limiting on signup/login/contact/password-reset endpoints
  - Contact honeypot support (`website` field)
  - Input length and format validation hardening
  - One-time password reset codes with expiry and token invalidation

### SEO and Discoverability

- `robots.txt` route at `/robots.txt`
- XML sitemap route at `/sitemap.xml`
  - Includes core public pages and published portfolio URLs
- Canonical URLs for index pages and portfolio pages
- Open Graph and Twitter metadata improvements
- JSON-LD structured data added for:
  - Main app pages (WebSite + SoftwareApplication)
  - Public portfolio pages (ProfilePage + Person)

### Accessibility

- Mobile menu accessibility improvements:
  - `aria-controls`
  - `aria-expanded`
  - `aria-hidden` state synchronization

## Additional Product Updates Completed

- Global brand migration from previous naming to QuickFolio
- Direct mail contact integration with `Ks6911843@gmail.com` in:
  - Navigation
  - Footer
  - Command center
  - Dedicated direct-mail content sections
- Professional demo disclaimers added in:
  - Landing metric display
  - Pricing section copy
- Cache/version refresh strategy updated to ensure users receive new assets quickly

## Legal Pages

- `/privacy` (Privacy Policy page)
- `/terms` (Terms of Service page)
- Footer links now point to active legal routes

## Tech Stack

- Python 3.12+
- Flask 3.x
- SQLite (WAL mode)
- Vanilla JavaScript
- ReportLab (PDF generation)

## Project Structure

```text
QuickFolio-fs/
  app.py
  requirements.txt
  .env.example
  README.md
  templates/
    index.html
    portfolio.html
    404.html
  static/
    sw.js
    css/
      main.css
      builder.css
      chatbot.css
      portfolio-view.css
    js/
      app.js
      pages.js
      builder.js
      renderer.js
      portfolio-view.js
      auth.js
      chatbot.js
      data.js
      utils.js
  instance/
    QuickFolio.db
```

## Local Setup

```bash
cd QuickFolio-fs
python -m venv .venv
source .venv/bin/activate  # Windows PowerShell: .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

Open: `http://localhost:5000`

## Environment Variables

Use `.env.example` as the base template.

Required for safe production:

- `SECRET_KEY` (must be set)

Recommended:

- `APP_ENV=production` (or `QUICKFOLIO_PRODUCTION=1`)
- `SITE_URL=https://your-domain.com` (for canonical/sitemap consistency)
- `COOKIE_SECURE=1` (if running only on HTTPS)

Optional integrations:

- OAuth credentials:
  - `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
  - `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`
- SMTP mail config:
  - `MAIL_SERVER`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_DEFAULT_SENDER`
- Password reset tuning:
  - `PASSWORD_RESET_TTL_MINUTES` (default: 20)

## Key Routes

### Public Pages

- `/`
- `/templates`
- `/pricing`
- `/manual`
- `/about`
- `/privacy`
- `/terms`
- `/p/<slug>`
- `/p/<slug>/resume.pdf`

### Discovery and SEO

- `/robots.txt`
- `/sitemap.xml`

### Authenticated Pages

- `/dashboard`
- `/builder`
- `/resume-editor`
- `/billing`
- `/admin` (admin only)

## Key API Groups

- Auth: `/api/auth/*` including `/api/auth/password-reset/request` and `/api/auth/password-reset/confirm`
- Portfolio: `/api/portfolio*`
- Templates: `/api/templates*`
- Billing: `/api/billing/*`, `/api/plans`
- Contact: `/api/contact/<slug>`
- Chatbot: `/api/chatbot`

## Deployment Notes

- Run behind HTTPS in production
- Set a strong `SECRET_KEY`
- Set stable `SITE_URL` to keep canonical/sitemap URLs consistent
- Place behind reverse proxy (Nginx/Caddy) for TLS and forwarding headers
- Keep Python dependencies updated

Example Gunicorn start:

```bash
gunicorn -w 4 -b 0.0.0.0:8000 app:app
```

## Professional Readiness Checklist

- Branding consistency: complete
- Direct contact path: complete
- Demo transparency copy: complete
- Security headers baseline: complete
- Cookie hardening baseline: complete
- Endpoint abuse controls baseline: complete
- robots/sitemap: complete
- Structured data baseline: complete
- Legal page routing/content: complete

## License

MIT