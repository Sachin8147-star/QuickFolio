"""
QuickFolio - Full Stack Portfolio Builder
Flask Backend with SQLite, JWT Auth, REST API
"""
import os, json, uuid, hashlib, hmac, time, re, secrets, threading, smtplib, gzip, importlib
import html as html_lib
from io import BytesIO
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from functools import wraps
from urllib.parse import urlencode, parse_qsl, urlparse
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from flask import (Flask, request, jsonify, render_template,
                   redirect, url_for, send_from_directory, session, make_response, g)
import sqlite3
try:
    _brotli = importlib.import_module('brotli')
except Exception:
    _brotli = None

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import HRFlowable, Image as RLImage, ListFlowable, ListItem, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)

def load_env_file(path):
    if not os.path.exists(path):
        return
    try:
        with open(path, 'r', encoding='utf-8') as f:
            for raw_line in f:
                line = raw_line.strip()
                if not line or line.startswith('#') or '=' not in line:
                    continue
                key, value = line.split('=', 1)
                key = key.strip()
                value = value.strip().strip('"').strip("'")
                if key and key not in os.environ:
                    os.environ[key] = value
    except Exception:
        pass

# Load .env/.flaskenv automatically for local development.
load_env_file(os.path.join(BASE_DIR, '.env'))
load_env_file(os.path.join(BASE_DIR, '.flaskenv'))


def is_truthy_env(value):
    return str(value or '').strip().lower() in {'1', 'true', 'yes', 'on'}


APP_ENV = str(os.environ.get('APP_ENV') or os.environ.get('FLASK_ENV') or '').strip().lower()
IS_PRODUCTION = APP_ENV == 'production' or is_truthy_env(os.environ.get('QUICKFOLIO_PRODUCTION'))
SITE_URL = str(os.environ.get('SITE_URL') or os.environ.get('PUBLIC_BASE_URL') or '').strip().rstrip('/')


def resolve_secret_key():
    configured = str(os.environ.get('SECRET_KEY') or '').strip()
    if configured:
        return configured
    if IS_PRODUCTION:
        raise RuntimeError('SECRET_KEY must be set in production.')
    return 'quickfolio-dev-secret-key-change-before-production'


app = Flask(__name__, template_folder='templates', static_folder='static')
app.secret_key = resolve_secret_key()
app.config['DATABASE'] = os.path.join(app.instance_path, 'QuickFolio.db')
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 86400

AUTH_COOKIE_MAX_AGE_SECONDS = 7 * 24 * 3600
RATE_LIMIT_STORE = {}
RATE_LIMIT_LOCK = threading.Lock()

try:
    PASSWORD_RESET_TTL_MINUTES = max(5, min(180, int(str(os.environ.get('PASSWORD_RESET_TTL_MINUTES') or '20').strip())))
except (TypeError, ValueError):
    PASSWORD_RESET_TTL_MINUTES = 20

PUBLIC_RESPONSE_CACHE = {}
PUBLIC_CACHE_TTL_SECONDS = {
    'templates_public': 60,
    'stats_public': 45,
}
COMPRESSIBLE_MIME_PREFIXES = (
    'text/',
    'application/json',
    'application/javascript',
    'application/xml',
    'application/xhtml+xml',
    'image/svg+xml',
)
MIN_COMPRESS_BYTES = 1024
ENABLE_DYNAMIC_COMPRESSION = not is_truthy_env(os.environ.get('DISABLE_DYNAMIC_COMPRESSION'))


def get_public_cache_entry(cache_key):
    ttl = int(PUBLIC_CACHE_TTL_SECONDS.get(cache_key) or 0)
    if ttl <= 0:
        return None

    entry = PUBLIC_RESPONSE_CACHE.get(cache_key)
    if not entry:
        return None

    if (time.time() - float(entry.get('ts') or 0)) > ttl:
        PUBLIC_RESPONSE_CACHE.pop(cache_key, None)
        return None

    return entry.get('payload')


def set_public_cache_entry(cache_key, payload):
    PUBLIC_RESPONSE_CACHE[cache_key] = {
        'ts': time.time(),
        'payload': payload,
    }


@app.before_request
def track_request_timing_start():
    g.request_timing_start = time.perf_counter()


def get_request_ip():
    forwarded = str(request.headers.get('X-Forwarded-For') or '').strip()
    if forwarded:
        return forwarded.split(',')[0].strip()[:128]
    return str(request.remote_addr or 'unknown')[:128]


def request_uses_https():
    if request.is_secure:
        return True
    forwarded_proto = str(request.headers.get('X-Forwarded-Proto') or '').split(',')[0].strip().lower()
    return forwarded_proto == 'https'


def should_set_secure_cookies():
    return request_uses_https() or is_truthy_env(os.environ.get('COOKIE_SECURE'))


def set_auth_cookie(response, token):
    response.set_cookie(
        'token',
        token,
        httponly=True,
        secure=should_set_secure_cookies(),
        samesite='Lax',
        max_age=AUTH_COOKIE_MAX_AGE_SECONDS,
        path='/',
    )


def is_rate_limited(bucket_key, limit, window_seconds):
    now = time.time()
    key = str(bucket_key or '').strip()
    if not key or limit <= 0 or window_seconds <= 0:
        return False

    with RATE_LIMIT_LOCK:
        bucket = RATE_LIMIT_STORE.setdefault(key, [])
        threshold = now - float(window_seconds)
        if bucket:
            RATE_LIMIT_STORE[key] = [ts for ts in bucket if ts >= threshold]
            bucket = RATE_LIMIT_STORE[key]

        if len(bucket) >= int(limit):
            return True

        bucket.append(now)
        return False


def get_public_site_root():
    if SITE_URL:
        return SITE_URL
    scheme = 'https' if request_uses_https() else (request.scheme or 'http')
    host = str(request.host or '').strip() or 'localhost:5000'
    return f'{scheme}://{host}'


def add_vary_header(response, header_name):
    name = str(header_name or '').strip()
    if not name:
        return

    existing = str(response.headers.get('Vary') or '').strip()
    if not existing:
        response.headers['Vary'] = name
        return

    values = [part.strip() for part in existing.split(',') if part.strip()]
    normalized = {part.lower() for part in values}
    if name.lower() in normalized:
        return

    values.append(name)
    response.headers['Vary'] = ', '.join(values)


def get_preferred_content_encoding(accept_encoding_header):
    if not ENABLE_DYNAMIC_COMPRESSION:
        return None

    accepted = str(accept_encoding_header or '').lower()
    if not accepted:
        return None

    supports_br = _brotli is not None and 'br' in accepted
    supports_gzip = 'gzip' in accepted

    if supports_br:
        return 'br'
    if supports_gzip:
        return 'gzip'
    return None


def should_compress_response(response, preferred_encoding):
    if not preferred_encoding:
        return False
    if request.method != 'GET':
        return False
    if response.status_code < 200 or response.status_code >= 300:
        return False
    if response.direct_passthrough:
        return False
    if response.headers.get('Content-Encoding'):
        return False

    content_type = str(response.mimetype or '').lower()
    if not content_type:
        return False

    if not any(
        content_type.startswith(prefix) or content_type == prefix
        for prefix in COMPRESSIBLE_MIME_PREFIXES
    ):
        return False

    content_length = response.calculate_content_length()
    if content_length is not None and content_length < MIN_COMPRESS_BYTES:
        return False

    return True


def compress_response_payload(response):
    preferred_encoding = get_preferred_content_encoding(request.headers.get('Accept-Encoding'))
    if not should_compress_response(response, preferred_encoding):
        return response

    raw = response.get_data()
    if not raw or len(raw) < MIN_COMPRESS_BYTES:
        return response

    compressed = None
    if preferred_encoding == 'br' and _brotli is not None:
        try:
            compressed = _brotli.compress(raw, quality=5)
        except Exception:
            compressed = None
    elif preferred_encoding == 'gzip':
        try:
            compressed = gzip.compress(raw, compresslevel=6)
        except Exception:
            compressed = None

    if not compressed or len(compressed) >= len(raw):
        return response

    response.set_data(compressed)
    response.headers['Content-Encoding'] = preferred_encoding
    response.headers['Content-Length'] = str(len(compressed))
    add_vary_header(response, 'Accept-Encoding')
    response.headers.pop('Accept-Ranges', None)
    return response


def is_probable_bot_ua(user_agent):
    ua = str(user_agent or '').strip().lower()
    if not ua:
        return False
    signals = (
        'bot', 'spider', 'crawler', 'slurp', 'bingpreview', 'facebookexternalhit',
        'linkedinbot', 'whatsapp', 'telegrambot', 'discordbot', 'google-inspectiontool',
    )
    return any(signal in ua for signal in signals)


def format_sitemap_lastmod(value):
    raw = str(value or '').strip()
    if not raw:
        return ''
    normalized = raw.replace('Z', '')
    try:
        return datetime.fromisoformat(normalized).date().isoformat()
    except Exception:
        return ''


def parse_metric_float(value, min_value=0.0, max_value=120000.0, decimals=2):
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return None

    if parsed != parsed:
        return None

    if parsed < min_value or parsed > max_value:
        return None
    return round(parsed, decimals)


def percentile_value(values, percentile=0.75):
    cleaned = sorted(float(v) for v in values if v is not None)
    if not cleaned:
        return None
    if len(cleaned) == 1:
        return cleaned[0]

    p = max(0.0, min(1.0, float(percentile)))
    position = (len(cleaned) - 1) * p
    lower = int(position)
    upper = min(lower + 1, len(cleaned) - 1)
    if lower == upper:
        return cleaned[lower]

    weight = position - lower
    return cleaned[lower] + (cleaned[upper] - cleaned[lower]) * weight


def classify_vital(metric_name, value):
    if value is None:
        return 'unknown'

    v = float(value)
    if metric_name == 'lcp_ms':
        if v <= 2500:
            return 'good'
        if v <= 4000:
            return 'needs-improvement'
        return 'poor'
    if metric_name == 'inp_ms':
        if v <= 200:
            return 'good'
        if v <= 500:
            return 'needs-improvement'
        return 'poor'
    if metric_name == 'cls':
        if v <= 0.1:
            return 'good'
        if v <= 0.25:
            return 'needs-improvement'
        return 'poor'
    if metric_name == 'fcp_ms':
        if v <= 1800:
            return 'good'
        if v <= 3000:
            return 'needs-improvement'
        return 'poor'
    if metric_name == 'ttfb_ms':
        if v <= 800:
            return 'good'
        if v <= 1800:
            return 'needs-improvement'
        return 'poor'
    return 'unknown'


@app.after_request
def apply_cache_headers(response):
    start = getattr(g, 'request_timing_start', None)
    if start is not None:
        elapsed_ms = max(0.0, (time.perf_counter() - start) * 1000.0)
        response.headers['X-Response-Time'] = f"{elapsed_ms:.1f}ms"
        response.headers['Server-Timing'] = f"app;dur={elapsed_ms:.1f}"

    path = str(request.path or '')
    if path.startswith('/static/'):
        if not response.headers.get('Cache-Control'):
            # Versioned static assets can be cached aggressively.
            if request.args.get('v'):
                response.headers['Cache-Control'] = 'public, max-age=31536000, immutable'
            else:
                response.headers['Cache-Control'] = 'public, max-age=604800, stale-while-revalidate=86400'
    elif response.mimetype == 'text/html':
        response.headers.setdefault('Cache-Control', 'public, max-age=0, must-revalidate')

    response.headers.setdefault('X-Content-Type-Options', 'nosniff')
    response.headers.setdefault('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.setdefault('X-Frame-Options', 'SAMEORIGIN')
    response.headers.setdefault('Permissions-Policy', 'geolocation=(), camera=(), microphone=()')

    if response.mimetype == 'text/html':
        response.headers.setdefault('Cross-Origin-Opener-Policy', 'same-origin-allow-popups')
        response.headers.setdefault('Cross-Origin-Resource-Policy', 'same-site')

        # CSP is strict enough to reduce injection risk while still allowing current inline scripts/styles.
        csp = '; '.join([
            "default-src 'self'",
            "base-uri 'self'",
            "object-src 'none'",
            "frame-ancestors 'self'",
            "img-src 'self' data: https:",
            "font-src 'self' https://fonts.gstatic.com data:",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "script-src 'self' 'unsafe-inline'",
            "connect-src 'self' https:",
            "form-action 'self'",
        ])
        response.headers.setdefault('Content-Security-Policy', csp)

        noindex_prefixes = (
            '/login',
            '/signup',
            '/dashboard',
            '/builder',
            '/resume-editor',
            '/billing',
            '/admin',
            '/api/',
        )
        if path.startswith(noindex_prefixes):
            response.headers.setdefault('X-Robots-Tag', 'noindex, nofollow')
        else:
            response.headers.setdefault('X-Robots-Tag', 'index, follow')

    if request_uses_https():
        response.headers.setdefault('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')

    return compress_response_payload(response)


def parse_admin_emails(value):
    raw = str(value or '')
    parts = re.split(r'[;,\s]+', raw)
    emails = set()
    for part in parts:
        item = part.strip().lower()
        if item:
            emails.add(item)
    return emails


ADMIN_EMAILS = parse_admin_emails(os.environ.get('ADMIN_EMAILS', ''))

SOCIAL_SOURCE_HOST_MAP = {
    'x.com': 'x',
    'twitter.com': 'x',
    't.co': 'x',
    'linkedin.com': 'linkedin',
    'instagram.com': 'instagram',
    'threads.net': 'threads',
    'facebook.com': 'facebook',
    'fb.com': 'facebook',
    'youtube.com': 'youtube',
    'youtu.be': 'youtube',
    'reddit.com': 'reddit',
    'pinterest.com': 'pinterest',
    'tiktok.com': 'tiktok',
    'github.com': 'github',
    'substack.com': 'substack',
}

os.makedirs(app.instance_path, exist_ok=True)
os.makedirs('static/uploads', exist_ok=True)

# ─────────────────────────────────────────────
# DATABASE
# ─────────────────────────────────────────────
def get_db():
    db = sqlite3.connect(app.config['DATABASE'])
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA journal_mode=WAL")
    return db

def init_db():
    with get_db() as db:
        db.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT,
            name TEXT NOT NULL,
            avatar TEXT DEFAULT '',
            bio TEXT DEFAULT '',
            plan TEXT DEFAULT 'free',
            provider TEXT DEFAULT 'email',
            provider_id TEXT DEFAULT '',
            created_at TEXT NOT NULL,
            last_login TEXT,
            is_active INTEGER DEFAULT 1,
            is_admin INTEGER DEFAULT 0,
            portfolio_views INTEGER DEFAULT 0,
            chatbot_conversations INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS portfolios (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            theme TEXT DEFAULT 'cyberpunk',
            is_published INTEGER DEFAULT 0,
            custom_domain TEXT DEFAULT '',
            sections_order TEXT DEFAULT '[]',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            views INTEGER DEFAULT 0,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS portfolio_sections (
            id TEXT PRIMARY KEY,
            portfolio_id TEXT NOT NULL,
            section_type TEXT NOT NULL,
            content TEXT NOT NULL DEFAULT '{}',
            is_visible INTEGER DEFAULT 1,
            order_index INTEGER DEFAULT 0,
            FOREIGN KEY(portfolio_id) REFERENCES portfolios(id)
        );

        CREATE TABLE IF NOT EXISTS contacts (
            id TEXT PRIMARY KEY,
            portfolio_id TEXT,
            sender_name TEXT NOT NULL,
            sender_email TEXT NOT NULL,
            subject TEXT DEFAULT '',
            message TEXT NOT NULL,
            is_read INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            ai_reply TEXT DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            email TEXT NOT NULL,
            token_hash TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            used_at TEXT DEFAULT '',
            created_at TEXT NOT NULL,
            request_ip TEXT DEFAULT '',
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS chatbot_logs (
            id TEXT PRIMARY KEY,
            portfolio_id TEXT,
            session_id TEXT,
            user_message TEXT NOT NULL,
            bot_reply TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS analytics (
            id TEXT PRIMARY KEY,
            portfolio_id TEXT NOT NULL,
            event_type TEXT NOT NULL,
            visitor_ip TEXT DEFAULT '',
            user_agent TEXT DEFAULT '',
            referrer TEXT DEFAULT '',
            source_label TEXT DEFAULT '',
            utm_source TEXT DEFAULT '',
            utm_medium TEXT DEFAULT '',
            utm_campaign TEXT DEFAULT '',
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS templates (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT DEFAULT '',
            theme TEXT NOT NULL,
            category TEXT DEFAULT 'general',
            preview_image TEXT DEFAULT '',
            sections_config TEXT DEFAULT '{}',
            is_featured INTEGER DEFAULT 0,
            uses INTEGER DEFAULT 0,
            created_by_user_id TEXT DEFAULT '',
            is_public INTEGER DEFAULT 1,
            approval_status TEXT DEFAULT 'approved',
            moderation_note TEXT DEFAULT '',
            demo_url TEXT DEFAULT '',
            created_at TEXT DEFAULT '',
            updated_at TEXT DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS design_presets (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL COLLATE NOCASE,
            snapshot TEXT NOT NULL DEFAULT '{}',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            UNIQUE(user_id, name),
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS resume_profiles (
            id TEXT PRIMARY KEY,
            user_id TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL DEFAULT 'Primary Resume',
            theme_id TEXT NOT NULL DEFAULT 'simple-arctic',
            content TEXT NOT NULL DEFAULT '{}',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS resume_documents (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL DEFAULT 'Primary Resume',
            theme_id TEXT NOT NULL DEFAULT 'simple-arctic',
            content TEXT NOT NULL DEFAULT '{}',
            is_default INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS subscriptions (
            id TEXT PRIMARY KEY,
            user_id TEXT UNIQUE NOT NULL,
            plan_id TEXT NOT NULL DEFAULT 'free',
            billing_cycle TEXT NOT NULL DEFAULT 'monthly',
            status TEXT NOT NULL DEFAULT 'active',
            current_period_start TEXT NOT NULL,
            current_period_end TEXT DEFAULT '',
            cancel_at_period_end INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS payment_methods (
            id TEXT PRIMARY KEY,
            user_id TEXT UNIQUE NOT NULL,
            brand TEXT DEFAULT 'Visa',
            last4 TEXT DEFAULT '4242',
            exp_month INTEGER DEFAULT 12,
            exp_year INTEGER DEFAULT 2030,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS billing_invoices (
            id TEXT PRIMARY KEY,
            invoice_no TEXT UNIQUE NOT NULL,
            user_id TEXT NOT NULL,
            plan_id TEXT NOT NULL,
            billing_cycle TEXT NOT NULL DEFAULT 'monthly',
            amount_inr INTEGER NOT NULL DEFAULT 0,
            currency TEXT NOT NULL DEFAULT 'INR',
            status TEXT NOT NULL DEFAULT 'paid',
            description TEXT DEFAULT '',
            issued_at TEXT NOT NULL,
            paid_at TEXT DEFAULT '',
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS performance_metrics (
            id TEXT PRIMARY KEY,
            user_id TEXT DEFAULT '',
            page_path TEXT NOT NULL DEFAULT '/',
            page_type TEXT DEFAULT 'web',
            lcp_ms REAL,
            inp_ms REAL,
            cls REAL,
            fcp_ms REAL,
            ttfb_ms REAL,
            network_type TEXT DEFAULT '',
            device_memory REAL,
            viewport TEXT DEFAULT '',
            created_at TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );
        """)

        def ensure_column(table_name, column_name, column_ddl):
            existing_cols = [row['name'] for row in db.execute(f"PRAGMA table_info({table_name})").fetchall()]
            if column_name in existing_cols:
                return
            db.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_ddl}")

        # Safe schema evolution for existing databases.
        ensure_column('users', 'is_admin', "is_admin INTEGER DEFAULT 0")
        ensure_column('templates', 'created_by_user_id', "created_by_user_id TEXT DEFAULT ''")
        ensure_column('templates', 'is_public', "is_public INTEGER DEFAULT 1")
        ensure_column('templates', 'approval_status', "approval_status TEXT DEFAULT 'approved'")
        ensure_column('templates', 'moderation_note', "moderation_note TEXT DEFAULT ''")
        ensure_column('templates', 'demo_url', "demo_url TEXT DEFAULT ''")
        ensure_column('templates', 'created_at', "created_at TEXT DEFAULT ''")
        ensure_column('templates', 'updated_at', "updated_at TEXT DEFAULT ''")
        ensure_column('analytics', 'source_label', "source_label TEXT DEFAULT ''")
        ensure_column('analytics', 'utm_source', "utm_source TEXT DEFAULT ''")
        ensure_column('analytics', 'utm_medium', "utm_medium TEXT DEFAULT ''")
        ensure_column('analytics', 'utm_campaign', "utm_campaign TEXT DEFAULT ''")
        ensure_column('resume_documents', 'is_default', "is_default INTEGER DEFAULT 0")

        db.execute("CREATE INDEX IF NOT EXISTS idx_resume_documents_user ON resume_documents(user_id)")
        db.execute("CREATE INDEX IF NOT EXISTS idx_resume_documents_user_updated ON resume_documents(user_id, updated_at DESC)")
        db.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_resume_documents_user_default ON resume_documents(user_id) WHERE is_default=1")
        db.execute("CREATE INDEX IF NOT EXISTS idx_perf_created ON performance_metrics(created_at DESC)")
        db.execute("CREATE INDEX IF NOT EXISTS idx_perf_page_type ON performance_metrics(page_type, created_at DESC)")
        db.execute("CREATE INDEX IF NOT EXISTS idx_perf_user_created ON performance_metrics(user_id, created_at DESC)")
        db.execute("CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_tokens(user_id)")
        db.execute("CREATE INDEX IF NOT EXISTS idx_password_reset_email_created ON password_reset_tokens(email, created_at DESC)")
        db.execute("CREATE INDEX IF NOT EXISTS idx_password_reset_expires ON password_reset_tokens(expires_at)")
        db.execute("CREATE INDEX IF NOT EXISTS idx_portfolios_user ON portfolios(user_id)")
        db.execute("CREATE INDEX IF NOT EXISTS idx_portfolios_published_updated ON portfolios(is_published, updated_at DESC)")
        db.execute("CREATE INDEX IF NOT EXISTS idx_portfolio_sections_portfolio_visible_order ON portfolio_sections(portfolio_id, is_visible, order_index)")
        db.execute("CREATE INDEX IF NOT EXISTS idx_contacts_portfolio_created ON contacts(portfolio_id, created_at DESC)")
        db.execute("CREATE INDEX IF NOT EXISTS idx_analytics_portfolio_event_created ON analytics(portfolio_id, event_type, created_at DESC)")
        db.execute("CREATE INDEX IF NOT EXISTS idx_templates_public_status_updated ON templates(is_public, approval_status, updated_at DESC)")

        # Seed templates
        now = utcnow().isoformat()
        templates = [
            ('tpl-1', 'Neon Night', 'High-energy cyberpunk aesthetic with glowing neon accents', 'cyberpunk', 'bold', 1, '/demo/cyberpunk'),
            ('tpl-2', 'Aurora Borealis', 'Cosmic purple-cyan gradient for creative developers', 'aurora', 'creative', 1, '/demo/aurora'),
            ('tpl-3', 'Dark Executive', 'Sleek obsidian with gold for senior engineers', 'obsidian', 'professional', 1, '/demo/obsidian'),
            ('tpl-4', 'Green Machine', 'Clean forest green palette with calm visuals', 'forest', 'minimal', 0, '/demo/forest'),
            ('tpl-5', 'Deep Ocean', 'Cool ocean blues for full-stack engineers', 'ocean', 'creative', 0, '/demo/ocean'),
            ('tpl-6', 'Classic Dark Pro', 'Timeless dark theme with strong readability', 'obsidian', 'professional', 0, '/demo/obsidian'),
            ('tpl-7', 'Startup Launchpad', 'CTA-heavy startup profile with social proof blocks', 'cyberpunk', 'bold', 1, '/demo/cyberpunk'),
            ('tpl-8', 'Minimal Recruiter', 'Low-noise layout focused on projects and outcomes', 'forest', 'minimal', 1, '/demo/forest'),
            ('tpl-9', 'Product Engineer Deck', 'Product-minded storytelling for cross-functional roles', 'aurora', 'professional', 0, '/demo/aurora'),
            ('tpl-10', 'AI Engineer Spotlight', 'Showcase LLM, data, and ML impact clearly', 'ocean', 'creative', 0, '/demo/ocean'),
            ('tpl-11', 'Agency Team Grid', 'Designed for agencies and multi-member showcases', 'obsidian', 'professional', 0, '/demo/obsidian'),
            ('tpl-12', 'Freelancer Conversion', 'Built for leads, inquiries, and client conversion', 'cyberpunk', 'creative', 0, '/demo/cyberpunk'),
        ]
        for t in templates:
            db.execute(
                """INSERT OR IGNORE INTO templates(
                       id,name,description,theme,category,is_featured,demo_url,is_public,approval_status,created_at,updated_at
                   ) VALUES(?,?,?,?,?,?,?,?,?,?,?)""",
                (*t, 1, 'approved', now, now)
            )

        # Backfill metadata for older template rows.
        db.execute("UPDATE templates SET approval_status='approved' WHERE COALESCE(approval_status, '')=''")
        db.execute("UPDATE templates SET is_public=1 WHERE is_public IS NULL")
        db.execute("UPDATE templates SET created_at=? WHERE COALESCE(created_at, '')=''", (now,))
        db.execute("UPDATE templates SET updated_at=created_at WHERE COALESCE(updated_at, '')=''")

        # Promote configured admin emails and ensure at least one admin account exists.
        if ADMIN_EMAILS:
            placeholders = ','.join(['?'] * len(ADMIN_EMAILS))
            db.execute(
                f"UPDATE users SET is_admin=1 WHERE lower(email) IN ({placeholders})",
                tuple(sorted(ADMIN_EMAILS))
            )

        admin_count = db.execute("SELECT COUNT(*) AS c FROM users WHERE is_admin=1").fetchone()['c']
        if admin_count == 0:
            first_user = db.execute("SELECT id FROM users ORDER BY created_at ASC LIMIT 1").fetchone()
            if first_user:
                db.execute("UPDATE users SET is_admin=1 WHERE id=?", (first_user['id'],))

        db.commit()

init_db()

# ─────────────────────────────────────────────
# AUTH HELPERS
# ─────────────────────────────────────────────
def hash_password(password):
    salt = os.urandom(32)
    key = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 100000)
    return salt.hex() + ':' + key.hex()

def verify_password(stored, provided):
    try:
        salt_hex, key_hex = stored.split(':')
        salt = bytes.fromhex(salt_hex)
        key = hashlib.pbkdf2_hmac('sha256', provided.encode(), salt, 100000)
        return hmac.compare_digest(key.hex(), key_hex)
    except:
        return False


def create_password_reset_code():
    return f"{secrets.randbelow(1000000):06d}"


def hash_password_reset_code(email, code):
    normalized_email = str(email or '').strip().lower()
    normalized_code = re.sub(r'[^0-9A-Za-z]+', '', str(code or '').strip())
    payload = f"{normalized_email}:{normalized_code}:{app.secret_key}"
    return hashlib.sha256(payload.encode()).hexdigest()


def send_password_reset_email(email, name, reset_code):
    mail_server = str(os.environ.get('MAIL_SERVER') or '').strip()
    mail_username = str(os.environ.get('MAIL_USERNAME') or '').strip()
    mail_password = str(os.environ.get('MAIL_PASSWORD') or '').strip()
    sender = str(os.environ.get('MAIL_DEFAULT_SENDER') or mail_username or '').strip()

    if not mail_server or not mail_username or not mail_password or not sender:
        return False

    try:
        mail_port = int(str(os.environ.get('MAIL_PORT') or '587').strip())
    except (TypeError, ValueError):
        mail_port = 587

    safe_name = str(name or 'there').strip() or 'there'
    msg = EmailMessage()
    msg['Subject'] = 'QuickFolio password reset code'
    msg['From'] = sender
    msg['To'] = str(email or '').strip().lower()
    msg.set_content(
        (
            f"Hi {safe_name},\n\n"
            f"Use this one-time QuickFolio password reset code: {reset_code}\n\n"
            f"This code expires in {PASSWORD_RESET_TTL_MINUTES} minutes.\n"
            "If you did not request this, you can safely ignore this email.\n\n"
            "- QuickFolio"
        )
    )

    try:
        if mail_port == 465:
            with smtplib.SMTP_SSL(mail_server, mail_port, timeout=12) as server:
                server.login(mail_username, mail_password)
                server.send_message(msg)
        else:
            with smtplib.SMTP(mail_server, mail_port, timeout=12) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(mail_username, mail_password)
                server.send_message(msg)
        return True
    except Exception as exc:
        print(f'[Auth] password reset email failed: {exc}')
        return False

def create_token(user_id, hours=168):
    payload = {'uid': user_id, 'exp': time.time() + hours*3600, 'iat': time.time()}
    data = json.dumps(payload)
    sig = hmac.new(app.secret_key.encode(), data.encode(), hashlib.sha256).hexdigest()
    import base64
    token = base64.b64encode(data.encode()).decode() + '.' + sig
    return token

def verify_token(token):
    try:
        import base64
        parts = token.split('.')
        if len(parts) != 2: return None
        data = base64.b64decode(parts[0]).decode()
        sig = hmac.new(app.secret_key.encode(), data.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, parts[1]): return None
        payload = json.loads(data)
        if payload['exp'] < time.time(): return None
        return payload['uid']
    except:
        return None

def get_current_user():
    token = request.cookies.get('token') or request.headers.get('Authorization','').replace('Bearer ','')
    if not token: return None
    uid = verify_token(token)
    if not uid: return None
    with get_db() as db:
        return db.execute("SELECT * FROM users WHERE id=? AND is_active=1", (uid,)).fetchone()

def login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        user = get_current_user()
        if not user:
            if request.is_json or request.path.startswith('/api/'):
                return jsonify({'error': 'Unauthorized'}), 401
            return redirect('/login')
        return f(*args, **kwargs, current_user=user)
    return wrapper


def is_admin_email(email):
    return str(email or '').strip().lower() in ADMIN_EMAILS


def ensure_admin_access(db, preferred_user_id=None, preferred_email=''):
    if preferred_user_id and is_admin_email(preferred_email):
        db.execute("UPDATE users SET is_admin=1 WHERE id=?", (preferred_user_id,))

    if ADMIN_EMAILS:
        placeholders = ','.join(['?'] * len(ADMIN_EMAILS))
        db.execute(
            f"UPDATE users SET is_admin=1 WHERE lower(email) IN ({placeholders})",
            tuple(sorted(ADMIN_EMAILS))
        )

    admin_count = db.execute("SELECT COUNT(*) AS c FROM users WHERE is_admin=1").fetchone()['c']
    if admin_count > 0:
        return

    target_user_id = preferred_user_id
    if not target_user_id:
        first_user = db.execute("SELECT id FROM users ORDER BY created_at ASC LIMIT 1").fetchone()
        target_user_id = first_user['id'] if first_user else None

    if target_user_id:
        db.execute("UPDATE users SET is_admin=1 WHERE id=?", (target_user_id,))


def is_admin_user(user_row):
    if not user_row:
        return False
    try:
        return bool(int(user_row['is_admin']))
    except Exception:
        return False


def admin_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        user = get_current_user()
        if not user:
            if request.is_json or request.path.startswith('/api/'):
                return jsonify({'error': 'Unauthorized'}), 401
            return redirect('/login')
        if not is_admin_user(user):
            if request.is_json or request.path.startswith('/api/'):
                return jsonify({'error': 'Admin access required'}), 403
            return redirect('/dashboard')
        return f(*args, **kwargs, current_user=user)
    return wrapper


def normalize_tracking_value(value, max_length=48):
    raw = str(value or '').strip().lower()
    if not raw:
        return ''
    raw = re.sub(r'[^a-z0-9_-]+', '-', raw)
    raw = re.sub(r'-{2,}', '-', raw).strip('-_')
    return raw[:max_length]


def infer_source_label(referrer):
    ref = str(referrer or '').strip()
    if not ref:
        return 'direct'

    try:
        host = urlparse(ref).netloc.lower().split('@')[-1].split(':')[0]
    except Exception:
        host = ''

    if not host:
        return 'direct'
    if host.startswith('www.'):
        host = host[4:]

    for domain, label in SOCIAL_SOURCE_HOST_MAP.items():
        if host == domain or host.endswith('.' + domain):
            return label

    candidate = normalize_tracking_value(host.split('.')[0], max_length=32)
    return candidate or 'referral'


def extract_traffic_context(req):
    utm_source = normalize_tracking_value(req.args.get('utm_source'))
    utm_medium = normalize_tracking_value(req.args.get('utm_medium'))
    utm_campaign = normalize_tracking_value(req.args.get('utm_campaign'))
    referrer = req.referrer or ''

    source_label = utm_source or infer_source_label(referrer)
    if source_label == 'direct' and utm_medium:
        source_label = utm_medium

    return {
        'referrer': referrer,
        'source_label': source_label or 'direct',
        'utm_source': utm_source,
        'utm_medium': utm_medium,
        'utm_campaign': utm_campaign,
    }

def build_unique_username(db, desired):
    base = re.sub(r'[^a-z0-9_]', '', (desired or '').lower())[:20]
    if not base:
        base = f"user{int(time.time())}"

    username = base
    counter = 1
    while db.execute("SELECT id FROM users WHERE username=?", (username,)).fetchone():
        suffix = str(counter)
        username = f"{base[:20-len(suffix)]}{suffix}"
        counter += 1
    return username

def create_default_portfolio(db, user_id, name, email, username_seed):
    now = utcnow().isoformat()
    pid = str(uuid.uuid4())
    seed = re.sub(r'[^a-z0-9-]', '', (username_seed or 'portfolio').replace('_', '-').lower()) or 'portfolio'
    slug = f"{seed}-{user_id[:6]}"

    while db.execute("SELECT id FROM portfolios WHERE slug=?", (slug,)).fetchone():
        slug = f"{seed}-{str(uuid.uuid4())[:6]}"

    db.execute("""INSERT INTO portfolios(id,user_id,slug,title,created_at,updated_at)
                  VALUES(?,?,?,?,?,?)""",
               (pid, user_id, slug, name + "'s Portfolio", now, now))

    default_sections = [
        ('hero', {
            "name": name,
            "title": "Full-Stack Developer",
            "tagline": "Building digital experiences that matter",
            "subtitle": "React · Node.js · Python · Cloud",
            "cta": "View My Work",
            "github": "",
            "linkedin": "",
            "twitter": "",
            "photo_url": "",
            "photo_size": 170,
            "photo_shape": "circle",
            "photo_offset_x": 0,
            "photo_offset_y": 0,
            "recruiter_mode_enabled": False,
            "design": {
                "bg_image_url": "",
                "bg_size": 100,
                "bg_overlay": 45,
                "bg_pos_x": 50,
                "bg_pos_y": 50,
                "text_scale": 100,
                "heading_scale": 100,
                "body_scale": 100,
                "section_spacing": 80,
                "card_radius": 16,
                "text_color": "",
                "accent_color": "",
                "bg_color": "",
                "surface_color": "",
                "card_color": "",
                "border_color": "",
                "border2_color": "",
                "accent2_color": "",
                "muted_color": "",
                "custom_theme_name": "My Custom Theme",
                "heading_font": "default",
                "body_font": "default",
                "section_scales": {
                    "hero": 100,
                    "about": 100,
                    "skills": 100,
                    "projects": 100,
                    "experience": 100,
                    "education": 100,
                    "stats": 100,
                    "timeline": 100,
                    "testimonials": 100,
                    "contact": 100
                },
                "section_fonts": {
                    "hero": "default",
                    "about": "default",
                    "skills": "default",
                    "projects": "default",
                    "experience": "default",
                    "education": "default",
                    "stats": "default",
                    "timeline": "default",
                    "testimonials": "default",
                    "contact": "default"
                }
            }
        }, 0),
        ('about', {"bio": "I'm a passionate developer who loves building scalable web applications.", "location": "India", "availability": "Open to opportunities", "highlights": ["Full-Stack Developer", "Open Source Contributor"]}, 1),
        ('skills', {"categories": [{"name": "Frontend", "items": [{"n": "React", "v": 90}, {"n": "CSS/Tailwind", "v": 85}]}, {"name": "Backend", "items": [{"n": "Python", "v": 88}, {"n": "Node.js", "v": 80}]}]}, 2),
        ('projects', {"items": [{"title": "My Project", "desc": "An awesome project I built", "tech": ["React", "Python"], "emoji": "🚀", "featured": True}]}, 3),
        ('contact', {"email": email, "phone": "", "message": "Let's build something amazing together!"}, 4),
    ]
    for stype, content, idx in default_sections:
        db.execute("""INSERT INTO portfolio_sections(id,portfolio_id,section_type,content,order_index)
                      VALUES(?,?,?,?,?)""",
                   (str(uuid.uuid4()), pid, stype, json.dumps(content), idx))

    return {'id': pid, 'slug': slug}

def parse_section_content(raw_content):
    if isinstance(raw_content, dict):
        return raw_content
    if isinstance(raw_content, str):
        try:
            parsed = json.loads(raw_content)
            return parsed if isinstance(parsed, dict) else {}
        except Exception:
            return {}
    return {}

def safe_text(value, default=''):
    text = str(value if value is not None else default).strip()
    if not text:
        text = str(default).strip()
    return text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

def resolve_resume_photo_source(photo_url):
    raw_url = str(photo_url or '').strip()
    if not raw_url:
        return None

    try:
        if raw_url.startswith('/static/uploads/'):
            filename = os.path.basename(raw_url)
            local_path = os.path.join(BASE_DIR, 'static', 'uploads', filename)
            if os.path.exists(local_path):
                return local_path

        if raw_url.startswith('static/uploads/'):
            filename = os.path.basename(raw_url)
            local_path = os.path.join(BASE_DIR, 'static', 'uploads', filename)
            if os.path.exists(local_path):
                return local_path

        if raw_url.startswith('http://') or raw_url.startswith('https://'):
            req = Request(raw_url, headers={'User-Agent': 'QuickFolio-Resume/1.0'}, method='GET')
            with urlopen(req, timeout=8) as response:
                data = response.read()
            if data:
                return BytesIO(data)
    except Exception:
        return None

    return None

TAILOR_TECH_KEYWORDS = [
    'python', 'flask', 'django', 'fastapi', 'javascript', 'typescript', 'react', 'next.js', 'node.js',
    'express', 'graphql', 'rest', 'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'docker',
    'kubernetes', 'aws', 'azure', 'gcp', 'terraform', 'ci/cd', 'pytest', 'jest', 'playwright',
    'tailwind', 'css', 'html', 'machine learning', 'llm', 'openai', 'langchain', 'microservices',
    'system design', 'data structures', 'algorithms', 'git'
]

TAILOR_STOPWORDS = {
    'the', 'and', 'for', 'with', 'that', 'from', 'this', 'your', 'you', 'our', 'their', 'into', 'will',
    'have', 'has', 'had', 'are', 'were', 'was', 'is', 'be', 'being', 'been', 'job', 'role', 'work',
    'team', 'teams', 'using', 'build', 'building', 'experience', 'years', 'year', 'required', 'preferred',
    'plus', 'must', 'strong', 'ability', 'skills', 'skill', 'developer', 'engineer', 'candidate', 'position'
}

RESUME_THEME_PALETTES = [
    {'id': 'arctic', 'name': 'Arctic', 'bg': '#f8fbff', 'panel': '#ffffff', 'text': '#0f172a', 'muted': '#475569', 'line': '#d7e3f4', 'accent': '#2563eb', 'accent2': '#06b6d4'},
    {'id': 'graphite', 'name': 'Graphite', 'bg': '#f6f7fb', 'panel': '#ffffff', 'text': '#111827', 'muted': '#4b5563', 'line': '#d8dde7', 'accent': '#374151', 'accent2': '#6b7280'},
    {'id': 'emerald', 'name': 'Emerald', 'bg': '#f5fff9', 'panel': '#ffffff', 'text': '#042f2e', 'muted': '#0f766e', 'line': '#ccefe4', 'accent': '#059669', 'accent2': '#10b981'},
    {'id': 'sunset', 'name': 'Sunset', 'bg': '#fff8f3', 'panel': '#ffffff', 'text': '#3b1f12', 'muted': '#9a3412', 'line': '#f5d9c8', 'accent': '#ea580c', 'accent2': '#f97316'},
    {'id': 'royal', 'name': 'Royal', 'bg': '#f8f7ff', 'panel': '#ffffff', 'text': '#1f1b4d', 'muted': '#4338ca', 'line': '#e2e0ff', 'accent': '#4f46e5', 'accent2': '#7c3aed'},
    {'id': 'rose', 'name': 'Rose', 'bg': '#fff7fb', 'panel': '#ffffff', 'text': '#4a1f3d', 'muted': '#9d174d', 'line': '#f4d8e8', 'accent': '#db2777', 'accent2': '#e11d48'},
    {'id': 'amber', 'name': 'Amber', 'bg': '#fffdf5', 'panel': '#ffffff', 'text': '#422006', 'muted': '#92400e', 'line': '#f6e7bf', 'accent': '#d97706', 'accent2': '#f59e0b'},
    {'id': 'oceanic', 'name': 'Oceanic', 'bg': '#f4fbff', 'panel': '#ffffff', 'text': '#082f49', 'muted': '#0f766e', 'line': '#cde9f5', 'accent': '#0284c7', 'accent2': '#0ea5e9'},
    {'id': 'slate', 'name': 'Slate', 'bg': '#f8fafc', 'panel': '#ffffff', 'text': '#0f172a', 'muted': '#64748b', 'line': '#dbe2ea', 'accent': '#334155', 'accent2': '#64748b'},
    {'id': 'midnight', 'name': 'Midnight', 'bg': '#f5f7ff', 'panel': '#ffffff', 'text': '#111827', 'muted': '#4338ca', 'line': '#d9e0ff', 'accent': '#312e81', 'accent2': '#6366f1'},
]

RESUME_THEME_TIERS = [
    {'id': 'simple', 'name': 'Simple', 'heading_font': 'Helvetica-Bold', 'body_font': 'Helvetica', 'heading_family': 'Outfit', 'body_family': 'Outfit', 'heading_size': 27, 'body_size': 10.0, 'line_weight': 0.75},
    {'id': 'clean', 'name': 'Clean', 'heading_font': 'Helvetica-Bold', 'body_font': 'Helvetica', 'heading_family': 'Syne', 'body_family': 'Outfit', 'heading_size': 28, 'body_size': 10.1, 'line_weight': 0.85},
    {'id': 'pro', 'name': 'Pro', 'heading_font': 'Times-Bold', 'body_font': 'Times-Roman', 'heading_family': 'Syne', 'body_family': 'Outfit', 'heading_size': 27, 'body_size': 10.3, 'line_weight': 0.95},
    {'id': 'elite', 'name': 'Elite', 'heading_font': 'Helvetica-Bold', 'body_font': 'Times-Roman', 'heading_family': 'Orbitron', 'body_family': 'Outfit', 'heading_size': 28, 'body_size': 10.4, 'line_weight': 1.0},
    {'id': 'ultra', 'name': 'Ultra', 'heading_font': 'Courier-Bold', 'body_font': 'Courier', 'heading_family': 'Orbitron', 'body_family': 'DM Mono', 'heading_size': 26, 'body_size': 9.9, 'line_weight': 1.1},
]


def build_resume_theme_catalog():
    catalog = []
    for tier in RESUME_THEME_TIERS:
        for palette in RESUME_THEME_PALETTES:
            theme_id = f"{tier['id']}-{palette['id']}"
            catalog.append({
                'id': theme_id,
                'name': f"{tier['name']} {palette['name']}",
                'tier': tier['id'],
                'tier_label': tier['name'],
                'palette': palette['id'],
                'palette_label': palette['name'],
                'bg': palette['bg'],
                'panel': palette['panel'],
                'text': palette['text'],
                'muted': palette['muted'],
                'line': palette['line'],
                'accent': palette['accent'],
                'accent2': palette['accent2'],
                'heading_font': tier['heading_font'],
                'body_font': tier['body_font'],
                'heading_family': tier['heading_family'],
                'body_family': tier['body_family'],
                'heading_size': tier['heading_size'],
                'body_size': tier['body_size'],
                'line_weight': tier['line_weight'],
            })
    return catalog


RESUME_THEME_CATALOG = build_resume_theme_catalog()
RESUME_THEME_MAP = {theme['id']: theme for theme in RESUME_THEME_CATALOG}
DEFAULT_RESUME_THEME_ID = RESUME_THEME_CATALOG[0]['id'] if RESUME_THEME_CATALOG else 'simple-arctic'


def get_resume_theme(theme_id=''):
    key = str(theme_id or '').strip().lower()
    if key and key in RESUME_THEME_MAP:
        return RESUME_THEME_MAP[key]
    return RESUME_THEME_MAP.get(DEFAULT_RESUME_THEME_ID) or (RESUME_THEME_CATALOG[0] if RESUME_THEME_CATALOG else {
        'id': 'simple-arctic',
        'name': 'Simple Arctic',
        'tier': 'simple',
        'tier_label': 'Simple',
        'palette': 'arctic',
        'palette_label': 'Arctic',
        'bg': '#f8fbff',
        'panel': '#ffffff',
        'text': '#0f172a',
        'muted': '#475569',
        'line': '#d7e3f4',
        'accent': '#2563eb',
        'accent2': '#06b6d4',
        'heading_font': 'Helvetica-Bold',
        'body_font': 'Helvetica',
        'heading_family': 'Outfit',
        'body_family': 'Outfit',
        'heading_size': 27,
        'body_size': 10.0,
        'line_weight': 0.75,
    })


RESUME_LAYOUT_MODES = {'compact', 'executive', 'ats-strict'}


def normalize_resume_layout_mode(value, default='executive'):
    raw = str(value or '').strip().lower()
    if raw in RESUME_LAYOUT_MODES:
        return raw
    fallback = str(default or 'executive').strip().lower()
    return fallback if fallback in RESUME_LAYOUT_MODES else 'executive'


def clean_resume_text(value, max_len=180, default=''):
    raw = str(value if value is not None else default)
    raw = re.sub(r'\s+', ' ', raw).strip()
    if not raw:
        raw = str(default).strip()
    if len(raw) > max_len:
        raw = raw[:max_len].rstrip()
    return raw


def normalize_resume_list(value, max_items=12, max_len=80):
    if isinstance(value, list):
        source = value
    else:
        source = re.split(r'[\n,;]+', str(value or ''))

    items = []
    seen = set()
    for raw in source:
        txt = clean_resume_text(raw, max_len=max_len)
        key = txt.lower()
        if not txt or key in seen:
            continue
        seen.add(key)
        items.append(txt)
        if len(items) >= max_items:
            break
    return items


def normalize_resume_bullets(value, max_items=6, max_len=220):
    if isinstance(value, list):
        source = value
    else:
        source = [line for line in re.split(r'\n+', str(value or '')) if line.strip()]

    bullets = []
    for raw in source:
        txt = clean_resume_text(raw, max_len=max_len)
        if not txt:
            continue
        bullets.append(txt)
        if len(bullets) >= max_items:
            break
    return bullets


def normalize_resume_editor_content(raw_content, owner=None):
    owner = owner or {}
    raw = raw_content if isinstance(raw_content, dict) else {}
    basics_raw = raw.get('basics') if isinstance(raw.get('basics'), dict) else {}

    full_name = clean_resume_text(basics_raw.get('full_name') or owner.get('name') or 'Developer', max_len=90)
    role = clean_resume_text(basics_raw.get('role') or 'Software Engineer', max_len=100)
    email = clean_resume_text(basics_raw.get('email') or owner.get('email') or '', max_len=120)

    basics = {
        'full_name': full_name,
        'role': role,
        'email': email,
        'phone': clean_resume_text(basics_raw.get('phone') or '', max_len=60),
        'location': clean_resume_text(basics_raw.get('location') or '', max_len=80),
        'website': clean_resume_text(basics_raw.get('website') or '', max_len=140),
        'linkedin': clean_resume_text(basics_raw.get('linkedin') or '', max_len=140),
        'github': clean_resume_text(basics_raw.get('github') or '', max_len=140),
        'photo_url': clean_resume_text(basics_raw.get('photo_url') or '', max_len=220),
        'summary': clean_resume_text(
            basics_raw.get('summary') or 'Outcome-focused engineer with strong product ownership and delivery discipline.',
            max_len=640,
        ),
    }

    skills = normalize_resume_list(raw.get('skills'), max_items=30, max_len=44)
    languages = normalize_resume_list(raw.get('languages'), max_items=12, max_len=44)

    experience_raw = raw.get('experience') if isinstance(raw.get('experience'), list) else []
    experience = []
    for item in experience_raw[:8]:
        if not isinstance(item, dict):
            continue
        title = clean_resume_text(item.get('title') or item.get('role') or '', max_len=90)
        company = clean_resume_text(item.get('company') or '', max_len=90)
        period = clean_resume_text(item.get('period') or '', max_len=60)
        bullets = normalize_resume_bullets(item.get('bullets'), max_items=6, max_len=200)
        if not bullets:
            desc_fallback = clean_resume_text(item.get('description') or item.get('desc') or '', max_len=240)
            if desc_fallback:
                bullets = [desc_fallback]
        if not title and not company and not period and not bullets:
            continue
        experience.append({
            'title': title,
            'company': company,
            'period': period,
            'bullets': bullets,
        })

    if not experience:
        experience = [{
            'title': 'Software Engineer',
            'company': 'Your Company',
            'period': '2022 - Present',
            'bullets': ['Delivered user-facing features with measurable quality and performance gains.'],
        }]

    projects_raw = raw.get('projects') if isinstance(raw.get('projects'), list) else []
    projects = []
    for item in projects_raw[:8]:
        if not isinstance(item, dict):
            continue
        title = clean_resume_text(item.get('title') or '', max_len=90)
        description = clean_resume_text(item.get('description') or item.get('desc') or '', max_len=260)
        tech = normalize_resume_list(item.get('tech'), max_items=8, max_len=30)
        link = clean_resume_text(item.get('link') or item.get('demo') or item.get('live') or '', max_len=160)
        if not title and not description and not tech and not link:
            continue
        projects.append({
            'title': title,
            'description': description,
            'tech': tech,
            'link': link,
        })

    education_raw = raw.get('education') if isinstance(raw.get('education'), list) else []
    education = []
    for item in education_raw[:5]:
        if not isinstance(item, dict):
            continue
        degree = clean_resume_text(item.get('degree') or '', max_len=110)
        school = clean_resume_text(item.get('school') or '', max_len=120)
        period = clean_resume_text(item.get('period') or '', max_len=60)
        details = clean_resume_text(item.get('details') or item.get('gpa') or '', max_len=120)
        if not degree and not school and not period and not details:
            continue
        education.append({
            'degree': degree,
            'school': school,
            'period': period,
            'details': details,
        })

    if not education:
        education = [{
            'degree': 'B.Tech Computer Science',
            'school': 'Your University',
            'period': '2018 - 2022',
            'details': '',
        }]

    certifications = normalize_resume_list(raw.get('certifications'), max_items=12, max_len=120)

    achievements_raw = raw.get('achievements') if isinstance(raw.get('achievements'), list) else []
    achievements = []
    for item in achievements_raw[:8]:
        if not isinstance(item, dict):
            continue
        title = clean_resume_text(item.get('title') or item.get('name') or '', max_len=120)
        issuer = clean_resume_text(item.get('issuer') or item.get('organization') or '', max_len=90)
        year = clean_resume_text(item.get('year') or item.get('date') or '', max_len=24)
        details = clean_resume_text(item.get('details') or item.get('description') or '', max_len=200)
        if not title and not issuer and not year and not details:
            continue
        achievements.append({
            'title': title,
            'issuer': issuer,
            'year': year,
            'details': details,
        })

    volunteer_raw = raw.get('volunteer') if isinstance(raw.get('volunteer'), list) else []
    if not volunteer_raw and isinstance(raw.get('volunteering'), list):
        volunteer_raw = raw.get('volunteering')

    volunteer = []
    for item in volunteer_raw[:6]:
        if not isinstance(item, dict):
            continue
        role = clean_resume_text(item.get('role') or item.get('title') or '', max_len=90)
        organization = clean_resume_text(item.get('organization') or item.get('company') or '', max_len=100)
        period = clean_resume_text(item.get('period') or '', max_len=60)
        bullets = normalize_resume_bullets(item.get('bullets'), max_items=4, max_len=180)
        if not bullets:
            details_fallback = clean_resume_text(item.get('details') or item.get('description') or item.get('desc') or '', max_len=220)
            if details_fallback:
                bullets = [details_fallback]
        if not role and not organization and not period and not bullets:
            continue
        volunteer.append({
            'role': role,
            'organization': organization,
            'period': period,
            'bullets': bullets,
        })

    return {
        'layout_mode': normalize_resume_layout_mode(raw.get('layout_mode'), default='executive'),
        'basics': basics,
        'skills': skills,
        'languages': languages,
        'experience': experience,
        'projects': projects,
        'education': education,
        'certifications': certifications,
        'achievements': achievements,
        'volunteer': volunteer,
    }


def portfolio_bundle_to_resume_content(owner, portfolio, sections):
    owner = owner or {}
    portfolio = portfolio or {}
    section_map = {}
    for section in (sections or []):
        section_type = section.get('section_type')
        if section_type:
            section_map[section_type] = parse_section_content(section.get('content'))

    hero = section_map.get('hero', {})
    about = section_map.get('about', {})
    contact = section_map.get('contact', {})
    skills_section = section_map.get('skills', {})
    experience_section = section_map.get('experience', {})
    projects_section = section_map.get('projects', {})
    education_section = section_map.get('education', {})

    skills = []
    categories = skills_section.get('categories') if isinstance(skills_section.get('categories'), list) else []
    for category in categories:
        items = category.get('items') if isinstance(category.get('items'), list) else []
        for item in items:
            label = str(item.get('n') or item.get('name') or '').strip()
            if label:
                skills.append(label)

    experience = []
    for item in (experience_section.get('items') if isinstance(experience_section.get('items'), list) else [])[:8]:
        desc = clean_resume_text(item.get('desc') or '', max_len=280)
        bullets = []
        if desc:
            for fragment in re.split(r'(?<=[.!?])\s+', desc):
                txt = clean_resume_text(fragment, max_len=180)
                if txt:
                    bullets.append(txt)
                if len(bullets) >= 4:
                    break
        if not bullets:
            bullets = normalize_resume_list(item.get('tech'), max_items=4, max_len=42)

        experience.append({
            'title': item.get('role') or '',
            'company': item.get('company') or '',
            'period': item.get('period') or '',
            'bullets': bullets,
        })

    projects = []
    for item in (projects_section.get('items') if isinstance(projects_section.get('items'), list) else [])[:8]:
        projects.append({
            'title': item.get('title') or '',
            'description': item.get('desc') or '',
            'tech': item.get('tech') if isinstance(item.get('tech'), list) else [],
            'link': item.get('link') or item.get('demo') or item.get('live') or '',
        })

    education = []
    for item in (education_section.get('items') if isinstance(education_section.get('items'), list) else [])[:5]:
        highlights = item.get('highlights') if isinstance(item.get('highlights'), list) else []
        details = ''
        if highlights:
            details = ', '.join(str(h) for h in highlights[:3] if str(h).strip())
        if not details:
            details = item.get('gpa') or ''
        education.append({
            'degree': item.get('degree') or '',
            'school': item.get('school') or '',
            'period': item.get('period') or '',
            'details': details,
        })

    candidate_owner = {
        'name': owner.get('name') or hero.get('name') or 'Developer',
        'email': owner.get('email') or contact.get('email') or '',
    }

    content = {
        'basics': {
            'full_name': hero.get('name') or owner.get('name') or 'Developer',
            'role': hero.get('title') or 'Software Engineer',
            'email': contact.get('email') or owner.get('email') or '',
            'phone': contact.get('phone') or '',
            'location': about.get('location') or '',
            'website': portfolio.get('custom_domain') or '',
            'linkedin': hero.get('linkedin') or '',
            'github': hero.get('github') or '',
            'photo_url': hero.get('photo_url') or about.get('photo_url') or '',
            'summary': about.get('bio') or hero.get('tagline') or '',
        },
        'skills': skills,
        'languages': [],
        'experience': experience,
        'projects': projects,
        'education': education,
        'certifications': [],
        'achievements': [],
        'volunteer': [],
    }

    return normalize_resume_editor_content(content, owner=candidate_owner)


def ensure_resume_profile(db, user_row):
    row = db.execute("SELECT * FROM resume_profiles WHERE user_id=? LIMIT 1", (user_row['id'],)).fetchone()
    if row:
        return row

    portfolio_row = db.execute(
        "SELECT * FROM portfolios WHERE user_id=? ORDER BY created_at DESC LIMIT 1",
        (user_row['id'],)
    ).fetchone()
    sections_rows = []
    if portfolio_row:
        sections_rows = db.execute(
            "SELECT * FROM portfolio_sections WHERE portfolio_id=? ORDER BY order_index",
            (portfolio_row['id'],)
        ).fetchall()

    owner_data = {
        'name': user_row['name'],
        'email': user_row['email'],
    }
    if portfolio_row:
        resume_content = portfolio_bundle_to_resume_content(
            owner_data,
            dict(portfolio_row),
            [dict(section) for section in sections_rows],
        )
    else:
        resume_content = normalize_resume_editor_content({}, owner=owner_data)

    now = utcnow().isoformat()
    profile_id = str(uuid.uuid4())
    db.execute(
        """INSERT INTO resume_profiles(id,user_id,title,theme_id,content,created_at,updated_at)
           VALUES(?,?,?,?,?,?,?)""",
        (
            profile_id,
            user_row['id'],
            'Primary Resume',
            DEFAULT_RESUME_THEME_ID,
            json.dumps(resume_content),
            now,
            now,
        )
    )
    return db.execute("SELECT * FROM resume_profiles WHERE id=?", (profile_id,)).fetchone()


def serialize_resume_profile(row, owner_defaults=None):
    owner_defaults = owner_defaults or {}
    theme = get_resume_theme(row['theme_id'])
    return {
        'id': row['id'],
        'title': row['title'],
        'theme_id': theme['id'],
        'content': normalize_resume_editor_content(parse_section_content(row['content']), owner=owner_defaults),
        'created_at': row['created_at'],
        'updated_at': row['updated_at'],
    }


def build_resume_seed_content_for_user(db, user_row):
    portfolio_row = db.execute(
        "SELECT * FROM portfolios WHERE user_id=? ORDER BY created_at DESC LIMIT 1",
        (user_row['id'],)
    ).fetchone()

    owner_data = {
        'name': user_row['name'],
        'email': user_row['email'],
    }

    if not portfolio_row:
        return normalize_resume_editor_content({}, owner=owner_data)

    sections_rows = db.execute(
        "SELECT * FROM portfolio_sections WHERE portfolio_id=? ORDER BY order_index",
        (portfolio_row['id'],)
    ).fetchall()

    return portfolio_bundle_to_resume_content(
        owner_data,
        dict(portfolio_row),
        [dict(section) for section in sections_rows],
    )


def get_resume_documents_for_user(db, user_id):
    return db.execute(
        """SELECT * FROM resume_documents
           WHERE user_id=?
           ORDER BY is_default DESC, updated_at DESC, created_at DESC""",
        (user_id,)
    ).fetchall()


def ensure_default_resume_document(db, user_id):
    default_row = db.execute(
        "SELECT id FROM resume_documents WHERE user_id=? AND is_default=1 LIMIT 1",
        (user_id,)
    ).fetchone()
    if default_row:
        return default_row['id']

    first_row = db.execute(
        """SELECT id FROM resume_documents
           WHERE user_id=?
           ORDER BY updated_at DESC, created_at DESC
           LIMIT 1""",
        (user_id,)
    ).fetchone()
    if not first_row:
        return ''

    db.execute("UPDATE resume_documents SET is_default=0 WHERE user_id=?", (user_id,))
    db.execute("UPDATE resume_documents SET is_default=1 WHERE id=? AND user_id=?", (first_row['id'], user_id))
    return first_row['id']


def set_default_resume_document(db, user_id, resume_id):
    rid = str(resume_id or '').strip()
    if not rid:
        return ''

    target = db.execute(
        "SELECT id FROM resume_documents WHERE id=? AND user_id=? LIMIT 1",
        (rid, user_id)
    ).fetchone()
    if not target:
        return ''

    db.execute("UPDATE resume_documents SET is_default=0 WHERE user_id=?", (user_id,))
    db.execute("UPDATE resume_documents SET is_default=1 WHERE id=? AND user_id=?", (rid, user_id))
    return rid


def ensure_resume_documents_for_user(db, user_row):
    docs = get_resume_documents_for_user(db, user_row['id'])
    if docs:
        ensure_default_resume_document(db, user_row['id'])
        return get_resume_documents_for_user(db, user_row['id'])

    legacy = db.execute(
        "SELECT * FROM resume_profiles WHERE user_id=? LIMIT 1",
        (user_row['id'],)
    ).fetchone()

    now = utcnow().isoformat()
    if legacy:
        legacy_content = normalize_resume_editor_content(
            parse_section_content(legacy['content']),
            owner={'name': user_row['name'], 'email': user_row['email']},
        )
        legacy_theme = get_resume_theme(legacy['theme_id'])
        db.execute(
            """INSERT INTO resume_documents(id,user_id,title,theme_id,content,is_default,created_at,updated_at)
               VALUES(?,?,?,?,?,?,?,?)""",
            (
                str(uuid.uuid4()),
                user_row['id'],
                clean_resume_text(legacy['title'] or 'Primary Resume', max_len=80, default='Primary Resume'),
                legacy_theme['id'],
                json.dumps(legacy_content),
                1,
                legacy['created_at'] or now,
                legacy['updated_at'] or now,
            )
        )
        return get_resume_documents_for_user(db, user_row['id'])

    seed_content = build_resume_seed_content_for_user(db, user_row)
    db.execute(
        """INSERT INTO resume_documents(id,user_id,title,theme_id,content,is_default,created_at,updated_at)
           VALUES(?,?,?,?,?,?,?,?)""",
        (
            str(uuid.uuid4()),
            user_row['id'],
            'Primary Resume',
            DEFAULT_RESUME_THEME_ID,
            json.dumps(seed_content),
            1,
            now,
            now,
        )
    )
    return get_resume_documents_for_user(db, user_row['id'])


def serialize_resume_document(row, owner_defaults=None):
    owner_defaults = owner_defaults or {}
    theme = get_resume_theme(row['theme_id'])
    return {
        'id': row['id'],
        'title': clean_resume_text(row['title'] or 'Resume', max_len=80, default='Resume'),
        'theme_id': theme['id'],
        'is_default': bool(row['is_default']),
        'content': normalize_resume_editor_content(parse_section_content(row['content']), owner=owner_defaults),
        'created_at': row['created_at'],
        'updated_at': row['updated_at'],
    }


def serialize_resume_documents(rows, owner_defaults=None):
    return [serialize_resume_document(row, owner_defaults=owner_defaults) for row in (rows or [])]


def get_resume_document_by_id(db, user_id, resume_id):
    rid = str(resume_id or '').strip()
    if not rid:
        return None
    return db.execute(
        "SELECT * FROM resume_documents WHERE id=? AND user_id=? LIMIT 1",
        (rid, user_id)
    ).fetchone()


def create_resume_document(db, user_row, title='Primary Resume', theme_id='', content=None, make_default=False):
    owner_defaults = {'name': user_row['name'], 'email': user_row['email']}
    selected_theme = get_resume_theme(theme_id)
    normalized_content = normalize_resume_editor_content(content or {}, owner=owner_defaults)
    now = utcnow().isoformat()
    doc_id = str(uuid.uuid4())

    should_default = bool(make_default)
    if not should_default:
        existing = db.execute("SELECT id FROM resume_documents WHERE user_id=? LIMIT 1", (user_row['id'],)).fetchone()
        if not existing:
            should_default = True

    if should_default:
        db.execute("UPDATE resume_documents SET is_default=0 WHERE user_id=?", (user_row['id'],))

    db.execute(
        """INSERT INTO resume_documents(id,user_id,title,theme_id,content,is_default,created_at,updated_at)
           VALUES(?,?,?,?,?,?,?,?)""",
        (
            doc_id,
            user_row['id'],
            clean_resume_text(title or 'Primary Resume', max_len=80, default='Primary Resume'),
            selected_theme['id'],
            json.dumps(normalized_content),
            1 if should_default else 0,
            now,
            now,
        )
    )
    return get_resume_document_by_id(db, user_row['id'], doc_id)


def update_resume_document(db, user_row, resume_id, payload):
    row = get_resume_document_by_id(db, user_row['id'], resume_id)
    if not row:
        return None

    owner_defaults = {'name': user_row['name'], 'email': user_row['email']}
    base_content = parse_section_content(row['content'])
    incoming_content = payload.get('content') if isinstance(payload.get('content'), dict) else base_content
    normalized_content = normalize_resume_editor_content(incoming_content, owner=owner_defaults)

    selected_theme = get_resume_theme(payload.get('theme_id') or row['theme_id'])
    next_title = clean_resume_text(payload.get('title') or row['title'] or 'Resume', max_len=80, default='Resume')
    now = utcnow().isoformat()

    db.execute(
        """UPDATE resume_documents
           SET title=?, theme_id=?, content=?, updated_at=?
           WHERE id=? AND user_id=?""",
        (
            next_title,
            selected_theme['id'],
            json.dumps(normalized_content),
            now,
            row['id'],
            user_row['id'],
        )
    )

    if payload.get('is_default') is True:
        set_default_resume_document(db, user_row['id'], row['id'])

    return get_resume_document_by_id(db, user_row['id'], row['id'])


def select_active_resume_document(rows, resume_id=''):
    docs = list(rows or [])
    rid = str(resume_id or '').strip()
    if rid:
        for row in docs:
            if row['id'] == rid:
                return row

    for row in docs:
        if int(row['is_default'] or 0) == 1:
            return row

    return docs[0] if docs else None


def strip_html_to_text(raw_html):
    if not raw_html:
        return ''
    text = re.sub(r'(?is)<script[^>]*>.*?</script>', ' ', str(raw_html))
    text = re.sub(r'(?is)<style[^>]*>.*?</style>', ' ', text)
    text = re.sub(r'(?is)<!--.*?-->', ' ', text)
    text = re.sub(r'(?is)<[^>]+>', ' ', text)
    text = html_lib.unescape(text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def fetch_job_text_from_url(job_url):
    target = str(job_url or '').strip()
    if not target:
        return ''
    if not re.match(r'^https?://', target, flags=re.I):
        target = 'https://' + target

    req = Request(target, headers={'User-Agent': 'QuickFolio-ResumeTailor/1.0'}, method='GET')
    with urlopen(req, timeout=10) as response:
        raw = response.read(450000)
    html_text = raw.decode('utf-8', errors='ignore')
    return strip_html_to_text(html_text)


def normalize_skill_token(value):
    token = re.sub(r'[^a-z0-9+#.]', '', str(value or '').strip().lower())
    if token in {'node', 'nodejs'}:
        return 'node.js'
    if token in {'next', 'nextjs'}:
        return 'next.js'
    if token == 'ts':
        return 'typescript'
    if token in {'js', 'javascript'}:
        return 'javascript'
    if token in {'py', 'python3'}:
        return 'python'
    return token


def extract_job_keywords(job_text):
    text = str(job_text or '').lower()
    if not text:
        return []

    found = []
    seen = set()

    for keyword in TAILOR_TECH_KEYWORDS:
        if keyword.lower() in text:
            key = keyword.lower()
            if key not in seen:
                seen.add(key)
                found.append(keyword)

    tokens = re.findall(r'[a-zA-Z][a-zA-Z0-9+.#-]{2,}', text)
    freq = {}
    for token in tokens:
        lowered = token.lower()
        if lowered in TAILOR_STOPWORDS:
            continue
        if len(lowered) < 4:
            continue
        freq[lowered] = freq.get(lowered, 0) + 1

    for token, _count in sorted(freq.items(), key=lambda item: (-item[1], item[0])):
        if token in seen:
            continue
        seen.add(token)
        found.append(token)
        if len(found) >= 16:
            break

    return found


def guess_job_title_from_text(job_text, fallback='Software Engineer'):
    text = str(job_text or '')
    patterns = [
        r'(?i)\b((?:senior|lead|principal|staff|junior)?\s*(?:full[-\s]?stack|frontend|back[-\s]?end|software|data|ml|devops|cloud)\s+(?:engineer|developer|scientist))\b',
        r'(?i)\b((?:engineering|product|technical)\s+manager)\b',
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return ' '.join(match.group(1).split())
    return fallback


def collect_portfolio_skill_set(section_map):
    skills = set()

    hero = section_map.get('hero', {})
    title = str(hero.get('title') or '').strip()
    if title:
        skills.update(re.findall(r'[A-Za-z][A-Za-z0-9+.#-]{2,}', title))

    skills_section = section_map.get('skills', {})
    categories = skills_section.get('categories') if isinstance(skills_section.get('categories'), list) else []
    for category in categories:
        items = category.get('items') if isinstance(category.get('items'), list) else []
        for item in items:
            label = str(item.get('n') or item.get('name') or '').strip()
            if label:
                skills.add(label)

    for source_key in ['projects', 'experience']:
        payload = section_map.get(source_key, {})
        items = payload.get('items') if isinstance(payload.get('items'), list) else []
        for item in items:
            tech_items = item.get('tech') if isinstance(item.get('tech'), list) else []
            for tech in tech_items:
                tech_text = str(tech).strip()
                if tech_text:
                    skills.add(tech_text)

    normalized = set()
    for skill in skills:
        normalized_token = normalize_skill_token(skill)
        if normalized_token:
            normalized.add(normalized_token)
    return normalized


def build_resume_tailoring(owner, portfolio, sections, job_text, job_url=''):
    owner = owner or {}
    portfolio = portfolio or {}
    section_map = {}
    for section in (sections or []):
        section_type = section.get('section_type')
        if section_type:
            section_map[section_type] = parse_section_content(section.get('content'))

    hero = section_map.get('hero', {})
    about = section_map.get('about', {})
    projects = section_map.get('projects', {})

    keywords = extract_job_keywords(job_text)
    normalized_keywords = [normalize_skill_token(term) for term in keywords]
    portfolio_skills = collect_portfolio_skill_set(section_map)

    matched = []
    missing = []
    seen = set()
    for idx, raw_term in enumerate(keywords):
        normalized = normalized_keywords[idx] if idx < len(normalized_keywords) else normalize_skill_token(raw_term)
        display_term = str(raw_term).strip()
        if not display_term:
            continue
        key = display_term.lower()
        if key in seen:
            continue
        seen.add(key)

        if normalized and normalized in portfolio_skills:
            matched.append(display_term)
        else:
            missing.append(display_term)

    denominator = max(1, min(10, len(keywords)))
    fit_score = int(round((len(matched[:10]) / denominator) * 100))
    fit_score = max(5, min(98, fit_score)) if keywords else 0

    role = guess_job_title_from_text(job_text, fallback=safe_text(hero.get('title') or 'Software Engineer'))
    top_focus = matched[:4] if matched else keywords[:4]
    name = safe_text(hero.get('name') or owner.get('name') or 'Candidate')

    headline_suffix = ' | '.join(top_focus[:3]) if top_focus else 'Impact-driven delivery'
    tailored_headline = f"{role} | {headline_suffix}"

    base_summary = safe_text(about.get('bio') or '')
    if base_summary:
        summary_seed = base_summary[:320]
    else:
        summary_seed = f"{name} builds reliable products with measurable impact and strong collaboration habits."

    if matched:
        matched_line = ', '.join(matched[:5])
        tailored_summary = f"Targeting {role}. Strong fit on {matched_line}. {summary_seed}"
    else:
        tailored_summary = f"Targeting {role}. {summary_seed}"

    project_items = projects.get('items') if isinstance(projects.get('items'), list) else []
    scored_projects = []
    normalized_match_set = set(normalize_skill_token(term) for term in matched)
    for item in project_items:
        tech_items = item.get('tech') if isinstance(item.get('tech'), list) else []
        normalized_tech = [normalize_skill_token(term) for term in tech_items]
        overlap = len([token for token in normalized_tech if token and token in normalized_match_set])
        scored_projects.append((overlap, bool(item.get('featured')), item))

    scored_projects.sort(key=lambda row: (-row[0], -int(row[1]), str(row[2].get('title') or '').lower()))
    recommended_projects = []
    resume_bullets = []
    for overlap, _featured, item in scored_projects[:3]:
        title = safe_text(item.get('title') or 'Project')
        desc = safe_text(item.get('desc') or '')
        tech_items = item.get('tech') if isinstance(item.get('tech'), list) else []
        tech_line = ', '.join(str(t) for t in tech_items[:4] if str(t).strip())
        if overlap > 0 and tech_line:
            bullet = f"Built {title} using {tech_line}, demonstrating direct relevance to target role requirements."
        elif desc:
            bullet = f"{title}: {desc[:140]}"
        else:
            bullet = f"{title}: Delivered production-ready features with clear user impact."
        recommended_projects.append(title)
        resume_bullets.append(bullet)

    if not resume_bullets:
        resume_bullets = [
            'Delivered product features end-to-end with strong ownership and quality focus.',
            'Collaborated across design, product, and engineering to ship user-facing improvements.',
        ]

    return {
        'job_url': str(job_url or '').strip(),
        'job_title': role,
        'fit_score': fit_score,
        'tailored_headline': tailored_headline,
        'tailored_summary': tailored_summary,
        'matched_skills': matched[:8],
        'missing_skills': missing[:8],
        'resume_bullets': resume_bullets[:5],
        'recommended_project_titles': recommended_projects[:5],
        'keywords': keywords[:12],
    }


def get_latest_user_portfolio_bundle(user_id):
    with get_db() as db:
        portfolio_row = db.execute(
            "SELECT * FROM portfolios WHERE user_id=? ORDER BY created_at DESC LIMIT 1",
            (user_id,)
        ).fetchone()
        if not portfolio_row:
            return None, [], None

        sections_rows = db.execute(
            """SELECT * FROM portfolio_sections WHERE portfolio_id=? ORDER BY order_index""",
            (portfolio_row['id'],)
        ).fetchall()
        owner_row = db.execute("SELECT name,email FROM users WHERE id=?", (user_id,)).fetchone()

    return dict(portfolio_row), [dict(row) for row in sections_rows], dict(owner_row) if owner_row else {}


def resolve_tailor_job_text(payload):
    data = payload or {}
    job_description = str(data.get('job_description') or '').strip()
    job_url = str(data.get('job_url') or '').strip()

    text = job_description
    source_url = job_url

    if not text and job_url:
        try:
            text = fetch_job_text_from_url(job_url)
        except Exception as exc:
            raise RuntimeError(f"Unable to fetch job URL: {exc}")

    text = re.sub(r'\s+', ' ', str(text or '')).strip()
    if len(text) > 8000:
        text = text[:8000]

    if len(text) < 40:
        raise RuntimeError('Provide a job description (at least 40 characters) or a readable job URL.')

    return text, source_url


def build_resume_pdf(owner, portfolio, sections, tailoring=None, layout_mode=''):
    owner = owner or {}
    portfolio = portfolio or {}
    tailor_data = tailoring if isinstance(tailoring, dict) else {}

    content = portfolio_bundle_to_resume_content(owner, portfolio, sections)
    basics = content.get('basics', {}) if isinstance(content.get('basics'), dict) else {}

    tailored_headline = clean_resume_text(tailor_data.get('tailored_headline') or '', max_len=100)
    tailored_summary = clean_resume_text(tailor_data.get('tailored_summary') or '', max_len=640)
    if tailored_headline:
        basics['role'] = tailored_headline
    if tailored_summary:
        basics['summary'] = tailored_summary

    resume_bullets = tailor_data.get('resume_bullets') if isinstance(tailor_data.get('resume_bullets'), list) else []
    normalized_tailored_bullets = normalize_resume_bullets(resume_bullets, max_items=6, max_len=200)
    if normalized_tailored_bullets and isinstance(content.get('experience'), list) and content['experience']:
        content['experience'][0]['bullets'] = normalized_tailored_bullets

    matched_skills = tailor_data.get('matched_skills') if isinstance(tailor_data.get('matched_skills'), list) else []
    missing_skills = tailor_data.get('missing_skills') if isinstance(tailor_data.get('missing_skills'), list) else []
    extra_skills = normalize_resume_list(matched_skills, max_items=8, max_len=44)
    if extra_skills:
        merged_skills = normalize_resume_list((content.get('skills') or []) + extra_skills, max_items=30, max_len=44)
        content['skills'] = merged_skills

    fit_score = int(tailor_data.get('fit_score') or 0)
    if fit_score or missing_skills:
        achievements = content.get('achievements') if isinstance(content.get('achievements'), list) else []
        if fit_score:
            achievements.insert(0, {
                'title': f"Role fit score: {fit_score}%",
                'issuer': clean_resume_text(tailor_data.get('job_title') or 'Target Role', max_len=90),
                'year': utcnow().strftime('%Y'),
                'details': '',
            })
        growth_focus = normalize_resume_list(missing_skills, max_items=4, max_len=40)
        if growth_focus:
            achievements.insert(0, {
                'title': 'Priority growth areas',
                'issuer': 'Skill Alignment',
                'year': '',
                'details': ', '.join(growth_focus),
            })
        content['achievements'] = achievements[:8]

    return build_resume_editor_pdf(
        owner,
        content,
        theme_id=DEFAULT_RESUME_THEME_ID,
        resume_title='Resume',
        layout_mode=layout_mode or content.get('layout_mode') or 'executive',
    )


def build_resume_editor_pdf(owner, resume_content, theme_id='', resume_title='Resume', layout_mode=''):
    owner = owner or {}
    content = normalize_resume_editor_content(resume_content, owner=owner)
    theme = get_resume_theme(theme_id)
    basics = content.get('basics', {})
    selected_layout = normalize_resume_layout_mode(layout_mode or content.get('layout_mode'), default='executive')
    is_compact = selected_layout == 'compact'
    is_ats = selected_layout == 'ats-strict'

    full_name = safe_text(basics.get('full_name') or owner.get('name') or 'Developer')
    role = safe_text(basics.get('role') or 'Software Engineer')
    photo_url = str(basics.get('photo_url') or '').strip()

    accent = colors.HexColor('#0f172a') if is_ats else colors.HexColor(theme['accent'])
    accent2 = colors.HexColor('#111827') if is_ats else colors.HexColor(theme['accent2'])
    ink = colors.HexColor('#111827') if is_ats else colors.HexColor(theme['text'])
    muted = colors.HexColor('#4b5563') if is_ats else colors.HexColor(theme['muted'])
    line = colors.HexColor('#d1d5db') if is_ats else colors.HexColor(theme['line'])
    panel_bg = colors.white if is_ats else colors.HexColor(theme['bg'])

    # Keep PDF typography professional and ATS-friendly regardless of flashy theme families.
    heading_font = 'Helvetica-Bold'
    body_font = 'Helvetica'
    heading_size = max(22.4 if is_compact else 24.0, float(theme.get('heading_size') or 27) - (2.0 if is_compact else 1.0))
    body_size = max(9.0 if is_compact else 9.4, float(theme.get('body_size') or 10.0) - (0.25 if is_compact else 0))
    line_weight = max(0.6, float(theme.get('line_weight') or 0.8) - (0.12 if is_compact else 0))

    left_margin_cm = 1.25 if is_compact else (1.55 if is_ats else 1.45)
    right_margin_cm = 1.25 if is_compact else (1.55 if is_ats else 1.45)
    top_margin_cm = 1.1 if is_compact else 1.35
    bottom_margin_cm = 0.95 if is_compact else 1.1

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=left_margin_cm * cm,
        rightMargin=right_margin_cm * cm,
        topMargin=top_margin_cm * cm,
        bottomMargin=bottom_margin_cm * cm,
        title=f"{full_name} {safe_text(resume_title)}",
        author=full_name,
    )

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='REName', parent=styles['Title'], fontName=heading_font, fontSize=heading_size, leading=heading_size + (2.0 if is_compact else 2.5), textColor=ink, spaceAfter=2))
    styles.add(ParagraphStyle(name='RERole', parent=styles['Normal'], fontName=heading_font, fontSize=11.3 if is_compact else 11.7, leading=13.8 if is_compact else 14.4, textColor=accent, spaceAfter=5 if is_compact else 6))
    styles.add(ParagraphStyle(name='REMeta', parent=styles['Normal'], fontName=body_font, fontSize=8.7 if is_compact else 9.0, leading=11.2 if is_compact else 11.8, textColor=muted, spaceAfter=2.2 if is_compact else 2.5))
    styles.add(ParagraphStyle(name='RESection', parent=styles['Heading2'], fontName=heading_font, fontSize=9.4 if is_compact else 9.9, leading=11.9 if is_compact else 12.4, textColor=accent, spaceBefore=8 if is_compact else 10, spaceAfter=3.5 if is_compact else 4, letterSpacing=0.15 if is_ats else 0.3))
    styles.add(ParagraphStyle(name='REBody', parent=styles['Normal'], fontName=body_font, fontSize=body_size, leading=13.6 if is_compact else 14.2, textColor=ink, spaceAfter=3.2 if is_compact else 4))
    styles.add(ParagraphStyle(name='REBodyTight', parent=styles['Normal'], fontName=body_font, fontSize=max(8.6, body_size - 0.2), leading=12.2 if is_compact else 12.8, textColor=ink, spaceAfter=2.1 if is_compact else 2.5))
    styles.add(ParagraphStyle(name='REItemTitle', parent=styles['Normal'], fontName=heading_font, fontSize=10.7, leading=13.4, textColor=ink, spaceAfter=2))
    styles.add(ParagraphStyle(name='RERightMeta', parent=styles['Normal'], fontName=body_font, fontSize=8.9, leading=11.8, textColor=muted, alignment=2))
    styles.add(ParagraphStyle(name='RESummary', parent=styles['REBody'], fontName=body_font, fontSize=body_size, leading=14.4, textColor=ink, spaceAfter=0))
    styles.add(ParagraphStyle(name='RETag', parent=styles['Normal'], fontName=body_font, fontSize=8.6, leading=11, textColor=ink, alignment=1))
    styles.add(ParagraphStyle(name='REBulletItem', parent=styles['REBodyTight'], fontName=body_font, leftIndent=10, spaceAfter=1))
    styles.add(ParagraphStyle(name='REFooter', parent=styles['Normal'], fontName=body_font, fontSize=8.3, leading=10.8, textColor=muted, alignment=1))

    def add_section_heading(story, title):
        story.append(Paragraph(safe_text(title).upper(), styles['RESection']))
        story.append(HRFlowable(width='100%', thickness=line_weight, color=line))
        story.append(Spacer(1, 4))

    def add_item_divider(story):
        story.append(HRFlowable(width='100%', thickness=max(0.35, line_weight * 0.45), color=line))
        story.append(Spacer(1, 3))

    def normalize_url(value):
        raw = str(value or '').strip()
        if not raw:
            return ''
        if re.match(r'^[a-z][a-z0-9+.-]*://', raw, flags=re.I):
            return raw
        return 'https://' + raw

    def compact_link(value, max_len=44):
        raw = str(value or '').strip()
        if not raw:
            return ''
        pretty = raw.replace('https://', '').replace('http://', '')
        if len(pretty) > max_len:
            pretty = pretty[: max_len - 1].rstrip('/') + '...'
        return safe_text(pretty)

    def add_tag_cloud(story, values, columns=3):
        items = [safe_text(v) for v in (values or []) if safe_text(v)]
        if not items:
            return

        if is_ats:
            story.append(Paragraph(' | '.join(items), styles['REBodyTight']))
            return

        col_count = max(1, min(columns, 4))
        rows = []
        for idx in range(0, len(items), col_count):
            row_items = items[idx: idx + col_count]
            while len(row_items) < col_count:
                row_items.append('')
            rows.append([Paragraph(text, styles['RETag']) if text else Paragraph('', styles['RETag']) for text in row_items])

        table = Table(rows, colWidths=[doc.width / col_count] * col_count)
        ts = [
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]
        for r_idx, row in enumerate(rows):
            for c_idx, cell in enumerate(row):
                cell_text = items[r_idx * col_count + c_idx] if (r_idx * col_count + c_idx) < len(items) else ''
                if cell_text:
                    ts.append(('BACKGROUND', (c_idx, r_idx), (c_idx, r_idx), panel_bg))
                    ts.append(('BOX', (c_idx, r_idx), (c_idx, r_idx), 0.35, line))
                else:
                    ts.append(('BACKGROUND', (c_idx, r_idx), (c_idx, r_idx), colors.white))
                    ts.append(('BOX', (c_idx, r_idx), (c_idx, r_idx), 0, colors.white))
        table.setStyle(TableStyle(ts))
        story.append(table)

    def add_bullet_list(story, values, max_items=6):
        bullets = [safe_text(v) for v in (values or []) if safe_text(v)][:max_items]
        if not bullets:
            return
        story.append(
            ListFlowable(
                [ListItem(Paragraph(item, styles['REBulletItem']), leftIndent=6) for item in bullets],
                bulletType='bullet',
                leftIndent=8,
                bulletFontSize=7,
                bulletOffsetY=2,
            )
        )

    def build_resume_photo():
        if is_ats:
            return None
        source = resolve_resume_photo_source(photo_url)
        if not source:
            return None
        try:
            side = 2.75 if is_compact else 3.1
            photo = RLImage(source, width=side * cm, height=side * cm)
            photo.hAlign = 'RIGHT'
            return photo
        except Exception:
            return None

    story = []
    header_items = [
        Paragraph(full_name, styles['REName']),
        Paragraph(role, styles['RERole']),
    ]

    meta_parts = []
    for key in ['email', 'phone', 'location', 'website']:
        value = safe_text(basics.get(key) or '')
        if value:
            if key == 'website':
                meta_parts.append(compact_link(value, max_len=40))
            else:
                meta_parts.append(value)
    if meta_parts:
        header_items.append(Paragraph(' | '.join(meta_parts), styles['REMeta']))

    social_parts = []
    for key in ['linkedin', 'github']:
        value = basics.get(key) or ''
        if value:
            social_parts.append(compact_link(value, max_len=44))
    if social_parts:
        header_items.append(Paragraph('Links: ' + ' | '.join(social_parts), styles['REMeta']))

    header_photo = build_resume_photo()
    if header_photo:
        header_table = Table(
            [[header_items, header_photo]],
            colWidths=[doc.width * 0.78, doc.width * 0.22]
        )
        header_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ]))
        story.append(header_table)
    else:
        story.extend(header_items)

    story.append(Spacer(1, 4 if is_compact else 5))
    story.append(HRFlowable(width='100%', thickness=max(0.9, line_weight + 0.2), color=accent if not is_ats else line))
    story.append(Spacer(1, 2 if is_compact else 3))

    summary = safe_text(basics.get('summary') or '')
    if summary:
        add_section_heading(story, 'Professional Summary')
        if is_ats:
            story.append(Paragraph(summary, styles['RESummary']))
        else:
            summary_box = Table([[Paragraph(summary, styles['RESummary'])]], colWidths=[doc.width])
            summary_box.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, 0), panel_bg),
                ('BOX', (0, 0), (0, 0), 0.5, line),
                ('LEFTPADDING', (0, 0), (0, 0), 9 if is_compact else 10),
                ('RIGHTPADDING', (0, 0), (0, 0), 9 if is_compact else 10),
                ('TOPPADDING', (0, 0), (0, 0), 6 if is_compact else 8),
                ('BOTTOMPADDING', (0, 0), (0, 0), 6 if is_compact else 8),
            ]))
            story.append(summary_box)

    skills = content.get('skills') if isinstance(content.get('skills'), list) else []
    if skills:
        add_section_heading(story, 'Core Skills')
        add_tag_cloud(story, skills, columns=4 if is_compact else 3)

    languages = content.get('languages') if isinstance(content.get('languages'), list) else []
    if languages:
        add_section_heading(story, 'Languages')
        add_tag_cloud(story, languages, columns=4 if is_compact else 3)

    experience = content.get('experience') if isinstance(content.get('experience'), list) else []
    experience_items = experience[:8]
    if experience_items:
        add_section_heading(story, 'Experience')
        for idx, item in enumerate(experience_items):
            title_left = safe_text(item.get('title') or '')
            company = safe_text(item.get('company') or '')
            period = safe_text(item.get('period') or '')
            headline = title_left if not company else f"{title_left}, {company}"
            header = Table(
                [[Paragraph(headline or 'Role', styles['REItemTitle']), Paragraph(period, styles['RERightMeta'])]],
                colWidths=[doc.width * 0.73, doc.width * 0.27]
            )
            header.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                ('TOPPADDING', (0, 0), (-1, -1), 0),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
            ]))
            story.append(header)

            bullets = item.get('bullets') if isinstance(item.get('bullets'), list) else []
            add_bullet_list(story, bullets, max_items=6)
            story.append(Spacer(1, 2))
            if idx < len(experience_items) - 1:
                add_item_divider(story)

    projects = content.get('projects') if isinstance(content.get('projects'), list) else []
    project_items = projects[:8]
    if project_items:
        add_section_heading(story, 'Projects')
        for idx, item in enumerate(project_items):
            title = safe_text(item.get('title') or 'Project')
            link = compact_link(item.get('link') or '', max_len=42)
            header = Table(
                [[Paragraph(title, styles['REItemTitle']), Paragraph(link, styles['RERightMeta'])]],
                colWidths=[doc.width * 0.67, doc.width * 0.33]
            )
            header.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                ('TOPPADDING', (0, 0), (-1, -1), 0),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
            ]))
            story.append(header)

            desc = safe_text(item.get('description') or '')
            if desc:
                story.append(Paragraph(desc, styles['REBodyTight']))

            tech = item.get('tech') if isinstance(item.get('tech'), list) else []
            tech_line = safe_text(' | '.join(str(t) for t in tech if str(t).strip()))
            if tech_line:
                story.append(Paragraph(f"<b>Tech:</b> {tech_line}", styles['REBodyTight']))

            story.append(Spacer(1, 2))
            if idx < len(project_items) - 1:
                add_item_divider(story)

    education = content.get('education') if isinstance(content.get('education'), list) else []
    education_items = education[:5]
    if education_items:
        add_section_heading(story, 'Education')
        for idx, item in enumerate(education_items):
            degree = safe_text(item.get('degree') or 'Degree')
            school = safe_text(item.get('school') or '')
            period = safe_text(item.get('period') or '')
            details = safe_text(item.get('details') or '')
            headline = degree if not school else f"{degree}, {school}"
            header = Table(
                [[Paragraph(headline, styles['REItemTitle']), Paragraph(period, styles['RERightMeta'])]],
                colWidths=[doc.width * 0.68, doc.width * 0.32]
            )
            header.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                ('TOPPADDING', (0, 0), (-1, -1), 0),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
            ]))
            story.append(header)
            if details:
                story.append(Paragraph(details, styles['REBodyTight']))
            story.append(Spacer(1, 2))
            if idx < len(education_items) - 1:
                add_item_divider(story)

    certifications = content.get('certifications') if isinstance(content.get('certifications'), list) else []
    if certifications:
        add_section_heading(story, 'Certifications')
        add_tag_cloud(story, certifications[:12], columns=3 if is_compact else 2)

    achievements = content.get('achievements') if isinstance(content.get('achievements'), list) else []
    achievement_items = achievements[:8]
    if achievement_items:
        add_section_heading(story, 'Achievements')
        for idx, item in enumerate(achievement_items):
            title = safe_text(item.get('title') or 'Achievement')
            issuer = safe_text(item.get('issuer') or '')
            year = safe_text(item.get('year') or '')
            details = safe_text(item.get('details') or '')
            right_meta = ' | '.join(part for part in [issuer, year] if part)
            header = Table(
                [[Paragraph(title, styles['REItemTitle']), Paragraph(right_meta, styles['RERightMeta'])]],
                colWidths=[doc.width * 0.7, doc.width * 0.3]
            )
            header.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                ('TOPPADDING', (0, 0), (-1, -1), 0),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
            ]))
            story.append(header)
            if details:
                story.append(Paragraph(details, styles['REBodyTight']))
            story.append(Spacer(1, 2))
            if idx < len(achievement_items) - 1:
                add_item_divider(story)

    volunteer = content.get('volunteer') if isinstance(content.get('volunteer'), list) else []
    volunteer_items = volunteer[:6]
    if volunteer_items:
        add_section_heading(story, 'Volunteer Experience')
        for idx, item in enumerate(volunteer_items):
            role_title = safe_text(item.get('role') or '')
            organization = safe_text(item.get('organization') or '')
            period = safe_text(item.get('period') or '')
            headline = role_title if not organization else f"{role_title}, {organization}"
            header = Table(
                [[Paragraph(headline or 'Volunteer Role', styles['REItemTitle']), Paragraph(period, styles['RERightMeta'])]],
                colWidths=[doc.width * 0.73, doc.width * 0.27]
            )
            header.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                ('TOPPADDING', (0, 0), (-1, -1), 0),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
            ]))
            story.append(header)

            bullets = item.get('bullets') if isinstance(item.get('bullets'), list) else []
            add_bullet_list(story, bullets, max_items=4)
            story.append(Spacer(1, 2))
            if idx < len(volunteer_items) - 1:
                add_item_divider(story)

    story.append(Spacer(1, 6 if is_compact else 8))
    story.append(HRFlowable(width='100%', thickness=line_weight, color=line))

    def draw_page_footer(canvas, doc_obj):
        canvas.saveState()
        canvas.setFillColor(muted)
        canvas.setFont(body_font, 8)
        canvas.drawRightString(doc_obj.pagesize[0] - doc_obj.rightMargin, 0.62 * cm, f"Page {canvas.getPageNumber()}")
        canvas.setStrokeColor(line if is_ats else accent2)
        canvas.setLineWidth(0.35)
        canvas.line(doc_obj.leftMargin, doc_obj.pagesize[1] - 0.72 * cm, doc_obj.pagesize[0] - doc_obj.rightMargin, doc_obj.pagesize[1] - 0.72 * cm)
        canvas.restoreState()

    doc.build(story, onFirstPage=draw_page_footer, onLaterPages=draw_page_footer)
    return buffer.getvalue()

OAUTH_PROVIDERS = {
    'github': {
        'display_name': 'GitHub',
        'client_id_env': 'GITHUB_CLIENT_ID',
        'client_secret_env': 'GITHUB_CLIENT_SECRET',
        'auth_url': 'https://github.com/login/oauth/authorize',
        'token_url': 'https://github.com/login/oauth/access_token',
        'scope': 'read:user user:email'
    },
    'google': {
        'display_name': 'Google',
        'client_id_env': 'GOOGLE_CLIENT_ID',
        'client_secret_env': 'GOOGLE_CLIENT_SECRET',
        'auth_url': 'https://accounts.google.com/o/oauth2/v2/auth',
        'token_url': 'https://oauth2.googleapis.com/token',
        'scope': 'openid email profile'
    },
    'linkedin': {
        'display_name': 'LinkedIn',
        'client_id_env': 'LINKEDIN_CLIENT_ID',
        'client_secret_env': 'LINKEDIN_CLIENT_SECRET',
        'auth_url': 'https://www.linkedin.com/oauth/v2/authorization',
        'token_url': 'https://www.linkedin.com/oauth/v2/accessToken',
        'scope': 'openid profile email'
    }
}

def get_oauth_provider(provider):
    key = (provider or '').lower()
    config = OAUTH_PROVIDERS.get(key)
    if not config:
        return None
    return {
        **config,
        'key': key,
        'client_id': (os.environ.get(config['client_id_env']) or '').strip(),
        'client_secret': (os.environ.get(config['client_secret_env']) or '').strip(),
    }

def clear_oauth_session():
    session.pop('oauth_state', None)
    session.pop('oauth_provider', None)
    session.pop('oauth_started_at', None)

def oauth_http_post_form(url, payload, headers=None):
    req_headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    if headers:
        req_headers.update(headers)

    req = Request(url, data=urlencode(payload).encode('utf-8'), headers=req_headers, method='POST')
    try:
        with urlopen(req, timeout=20) as response:
            body = response.read().decode('utf-8')
    except HTTPError as exc:
        body = ''
        try:
            body = exc.read().decode('utf-8', errors='ignore')
        except Exception:
            pass
        raise RuntimeError(f'HTTP {exc.code}: {body or exc.reason}')
    except URLError as exc:
        raise RuntimeError(f'Network error: {exc.reason}')

    if not body:
        return {}
    try:
        return json.loads(body)
    except json.JSONDecodeError:
        return dict(parse_qsl(body))

def oauth_http_get_json(url, headers=None):
    req_headers = {'Accept': 'application/json'}
    if headers:
        req_headers.update(headers)

    req = Request(url, headers=req_headers, method='GET')
    try:
        with urlopen(req, timeout=20) as response:
            body = response.read().decode('utf-8')
    except HTTPError as exc:
        body = ''
        try:
            body = exc.read().decode('utf-8', errors='ignore')
        except Exception:
            pass
        raise RuntimeError(f'HTTP {exc.code}: {body or exc.reason}')
    except URLError as exc:
        raise RuntimeError(f'Network error: {exc.reason}')

    if not body:
        return {}
    return json.loads(body)

def exchange_oauth_code_for_token(provider, oauth_cfg, code, redirect_uri):
    if provider == 'github':
        payload = {
            'client_id': oauth_cfg['client_id'],
            'client_secret': oauth_cfg['client_secret'],
            'code': code,
            'redirect_uri': redirect_uri
        }
    else:
        payload = {
            'client_id': oauth_cfg['client_id'],
            'client_secret': oauth_cfg['client_secret'],
            'code': code,
            'redirect_uri': redirect_uri,
            'grant_type': 'authorization_code'
        }

    token_data = oauth_http_post_form(oauth_cfg['token_url'], payload)
    access_token = token_data.get('access_token')
    if not access_token:
        raise RuntimeError(token_data.get('error_description') or token_data.get('error') or 'Provider did not return access token')
    return access_token

def fetch_oauth_profile(provider, access_token):
    auth_headers = {'Authorization': f'Bearer {access_token}'}

    if provider == 'github':
        headers = {**auth_headers, 'User-Agent': 'QuickFolio-OAuth'}
        user_info = oauth_http_get_json('https://api.github.com/user', headers=headers)
        provider_id = str(user_info.get('id') or '')
        if not provider_id:
            raise RuntimeError('GitHub response missing user id')

        email = (user_info.get('email') or '').strip().lower()
        if not email:
            emails = oauth_http_get_json('https://api.github.com/user/emails', headers=headers)
            if isinstance(emails, list) and emails:
                primary = next((e for e in emails if e.get('primary') and e.get('verified')), None)
                verified = primary or next((e for e in emails if e.get('verified')), None) or emails[0]
                email = (verified.get('email') or '').strip().lower()

        return {
            'provider_id': provider_id,
            'email': email,
            'name': (user_info.get('name') or user_info.get('login') or 'GitHub User').strip(),
            'username_seed': (user_info.get('login') or email.split('@')[0] if email else 'github').strip()
        }

    if provider == 'google':
        user_info = oauth_http_get_json('https://openidconnect.googleapis.com/v1/userinfo', headers=auth_headers)
        provider_id = str(user_info.get('sub') or '')
        if not provider_id:
            raise RuntimeError('Google response missing user id')
        email = (user_info.get('email') or '').strip().lower()
        return {
            'provider_id': provider_id,
            'email': email,
            'name': (user_info.get('name') or user_info.get('given_name') or 'Google User').strip(),
            'username_seed': (email.split('@')[0] if email else (user_info.get('given_name') or 'google')).strip()
        }

    if provider == 'linkedin':
        user_info = oauth_http_get_json('https://api.linkedin.com/v2/userinfo', headers=auth_headers)
        provider_id = str(user_info.get('sub') or '')
        if not provider_id:
            raise RuntimeError('LinkedIn response missing user id')
        email = (user_info.get('email') or user_info.get('emailAddress') or '').strip().lower()
        full_name = (user_info.get('name') or '').strip()
        if not full_name:
            given = (user_info.get('given_name') or '').strip()
            family = (user_info.get('family_name') or '').strip()
            full_name = f'{given} {family}'.strip() or 'LinkedIn User'

        username_seed = (user_info.get('preferred_username') or (email.split('@')[0] if email else 'linkedin')).strip()
        return {
            'provider_id': provider_id,
            'email': email,
            'name': full_name,
            'username_seed': username_seed
        }

    raise RuntimeError('Unsupported provider')

def find_or_create_social_user(provider, profile):
    provider_id = (profile.get('provider_id') or '').strip()
    if not provider_id:
        raise RuntimeError('Missing provider user id')

    email = (profile.get('email') or '').strip().lower()
    name = (profile.get('name') or OAUTH_PROVIDERS[provider]['display_name'] + ' User').strip()
    username_seed = (profile.get('username_seed') or (email.split('@')[0] if email else provider)).strip()
    if not email:
        email = f'{provider}-{provider_id}@users.noreply.quickfolio.app'

    now = utcnow().isoformat()

    with get_db() as db:
        user = db.execute("SELECT * FROM users WHERE provider=? AND provider_id=?", (provider, provider_id)).fetchone()
        if not user:
            user = db.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()

        if user:
            db.execute("UPDATE users SET last_login=? WHERE id=?", (now, user['id']))
            ensure_admin_access(db, preferred_user_id=user['id'], preferred_email=user['email'] or email)
            has_portfolio = db.execute("SELECT id FROM portfolios WHERE user_id=? LIMIT 1", (user['id'],)).fetchone()
            if not has_portfolio:
                create_default_portfolio(db, user['id'], user['name'] or name, user['email'] or email, user['username'] or username_seed)
            db.commit()
            return db.execute("SELECT * FROM users WHERE id=?", (user['id'],)).fetchone()

        uid = str(uuid.uuid4())
        username = build_unique_username(db, username_seed)
        is_admin = 1 if is_admin_email(email) else 0
        db.execute("""INSERT INTO users(id,email,username,password_hash,name,provider,provider_id,is_admin,created_at,last_login)
                      VALUES(?,?,?,?,?,?,?,?,?,?)""",
                   (uid, email, username, None, name, provider, provider_id, is_admin, now, now))
        create_default_portfolio(db, uid, name, email, username)
        ensure_admin_access(db, preferred_user_id=uid, preferred_email=email)
        db.commit()
        return db.execute("SELECT * FROM users WHERE id=?", (uid,)).fetchone()

def issue_auth_cookie_redirect(user, redirect_path='/dashboard'):
    token = create_token(user['id'])
    resp = make_response(redirect(redirect_path))
    set_auth_cookie(resp, token)
    return resp

# ─────────────────────────────────────────────
# PAGE ROUTES (Frontend)
# ─────────────────────────────────────────────
@app.route('/')
def index():
    return render_template('index.html', page='landing')


@app.route('/robots.txt')
def robots_txt():
    site_root = get_public_site_root()
    site_host = urlparse(site_root).netloc or str(request.host or '').strip()
    body = '\n'.join([
        'User-agent: *',
        'Allow: /',
        'Disallow: /api/',
        'Disallow: /dashboard',
        'Disallow: /builder',
        'Disallow: /resume-editor',
        'Disallow: /billing',
        'Disallow: /admin',
        f'Host: {site_host}',
        f'Sitemap: {site_root}/sitemap.xml',
        '',
    ])
    response = make_response(body)
    response.headers['Content-Type'] = 'text/plain; charset=utf-8'
    response.headers['Cache-Control'] = 'public, max-age=3600'
    return response


@app.route('/sitemap.xml')
def sitemap_xml():
    site_root = get_public_site_root()
    today_iso = utcnow().date().isoformat()
    static_entries = [
        ('/', today_iso, 'daily', '1.00'),
        ('/templates', today_iso, 'daily', '0.90'),
        ('/pricing', today_iso, 'weekly', '0.80'),
        ('/manual', today_iso, 'weekly', '0.70'),
        ('/about', today_iso, 'monthly', '0.60'),
        ('/privacy', today_iso, 'yearly', '0.30'),
        ('/terms', today_iso, 'yearly', '0.30'),
    ]

    with get_db() as db:
        published_rows = db.execute(
            "SELECT slug, updated_at FROM portfolios WHERE is_published=1 ORDER BY updated_at DESC"
        ).fetchall()

    entries = []
    for path_suffix, lastmod, changefreq, priority in static_entries:
        entries.append({
            'loc': f'{site_root}{path_suffix}',
            'lastmod': lastmod,
            'changefreq': changefreq,
            'priority': priority,
        })

    for row in published_rows:
        slug = str(row['slug'] or '').strip()
        if not slug:
            continue
        entries.append({
            'loc': f'{site_root}/p/{slug}',
            'lastmod': format_sitemap_lastmod(row['updated_at']),
            'changefreq': 'weekly',
            'priority': '0.80',
        })

    xml_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]

    for entry in entries:
        loc = entry.get('loc')
        lastmod = entry.get('lastmod')
        changefreq = entry.get('changefreq')
        priority = entry.get('priority')
        xml_lines.append('  <url>')
        xml_lines.append(f'    <loc>{html_lib.escape(loc, quote=True)}</loc>')
        if lastmod:
            xml_lines.append(f'    <lastmod>{html_lib.escape(lastmod, quote=True)}</lastmod>')
        if changefreq:
            xml_lines.append(f'    <changefreq>{html_lib.escape(changefreq, quote=True)}</changefreq>')
        if priority:
            xml_lines.append(f'    <priority>{html_lib.escape(priority, quote=True)}</priority>')
        xml_lines.append('  </url>')

    xml_lines.append('</urlset>')
    response = make_response('\n'.join(xml_lines))
    response.headers['Content-Type'] = 'application/xml; charset=utf-8'
    response.headers['Cache-Control'] = 'public, max-age=1800'
    return response


@app.route('/sw.js')
def service_worker():
    response = send_from_directory(app.static_folder, 'sw.js')
    response.headers['Cache-Control'] = 'no-cache'
    response.headers['Service-Worker-Allowed'] = '/'
    response.headers['Content-Type'] = 'application/javascript; charset=utf-8'
    return response

@app.route('/login')
def login_page():
    user = get_current_user()
    if user: return redirect('/dashboard')
    return render_template('index.html', page='login')

@app.route('/signup')
def signup_page():
    user = get_current_user()
    if user: return redirect('/dashboard')
    return render_template('index.html', page='signup')

@app.route('/dashboard')
@login_required
def dashboard(current_user):
    return render_template('index.html', page='dashboard', user=dict(current_user))

@app.route('/builder')
@login_required
def builder_page(current_user):
    return render_template('index.html', page='builder', user=dict(current_user))


@app.route('/resume-editor')
@login_required
def resume_editor_page(current_user):
    return render_template('index.html', page='resume-editor', user=dict(current_user))

@app.route('/templates')
def templates_page():
    return render_template('index.html', page='templates')

@app.route('/docs')
def docs_page():
    return render_template('index.html', page='manual')

@app.route('/manual')
def manual_page():
    return render_template('index.html', page='manual')

@app.route('/about')
def about_page():
    return render_template('index.html', page='about')


@app.route('/privacy')
def privacy_page():
    return render_template('index.html', page='privacy')


@app.route('/terms')
def terms_page():
    return render_template('index.html', page='terms')

@app.route('/pricing')
def pricing_page():
    return render_template('index.html', page='pricing')

@app.route('/billing')
@login_required
def billing_page(current_user):
    return render_template('index.html', page='billing', user=dict(current_user))


@app.route('/admin')
@admin_required
def admin_page(current_user):
    return render_template('index.html', page='admin', user=dict(current_user))


@app.route('/demo/<theme>')
def demo_portfolio(theme):
    selected_theme = str(theme or 'cyberpunk').strip().lower()
    allowed_themes = {'cyberpunk', 'aurora', 'obsidian', 'forest', 'ocean'}
    if selected_theme not in allowed_themes:
        selected_theme = 'cyberpunk'

    owner = {'name': 'Demo Developer', 'email': 'demo@quickfolio.app'}
    portfolio = {
        'id': f'demo-{selected_theme}',
        'slug': f'demo-{selected_theme}',
        'title': f'{selected_theme.title()} Demo Portfolio',
        'theme': selected_theme,
        'is_published': 1,
        'views': 0,
    }

    sections_payload = [
        {'id': 'demo-hero', 'section_type': 'hero', 'content': {
            'name': 'Demo Developer',
            'title': 'Senior Full-Stack Engineer',
            'tagline': 'Building scalable products with measurable impact',
            'subtitle': 'Python · React · Cloud · AI Integrations',
            'cta': 'View Projects',
            'github': 'https://github.com',
            'linkedin': 'https://linkedin.com',
            'twitter': '',
            'recruiter_mode_enabled': False,
        }},
        {'id': 'demo-about', 'section_type': 'about', 'content': {
            'bio': 'This is a sample portfolio demonstrating QuickFolio layouts, hierarchy, and content depth.',
            'location': 'India',
            'availability': 'Open to product engineering roles',
            'highlights': ['System design', 'AI workflow integration', 'Mentoring']
        }},
        {'id': 'demo-skills', 'section_type': 'skills', 'content': {
            'categories': [
                {'name': 'Frontend', 'items': [{'n': 'React', 'v': 92}, {'n': 'TypeScript', 'v': 86}]},
                {'name': 'Backend', 'items': [{'n': 'Python', 'v': 94}, {'n': 'Flask', 'v': 88}]},
                {'name': 'Cloud', 'items': [{'n': 'AWS', 'v': 82}, {'n': 'Docker', 'v': 84}]}
            ]
        }},
        {'id': 'demo-projects', 'section_type': 'projects', 'content': {
            'items': [
                {
                    'title': 'Interview Insight Dashboard',
                    'desc': 'Analyzed recruiter interactions and boosted interview conversion by 31%.',
                    'tech': ['React', 'Flask', 'SQLite'],
                    'emoji': '📊',
                    'featured': True,
                    'link': 'https://example.com/demo',
                    'github': 'https://github.com'
                },
                {
                    'title': 'Role-Tailored Resume Engine',
                    'desc': 'Generated role-fit resumes with keyword alignment and project prioritization.',
                    'tech': ['Python', 'NLP', 'APIs'],
                    'emoji': '🎯',
                    'featured': True,
                    'link': 'https://example.com/demo',
                    'github': 'https://github.com'
                }
            ]
        }},
        {'id': 'demo-contact', 'section_type': 'contact', 'content': {
            'email': 'demo@quickfolio.app',
            'phone': '+91 90000 00000',
            'message': 'This demo showcases what your finished QuickFolio portfolio can look like.'
        }},
    ]

    return render_template('portfolio.html', portfolio=portfolio, sections=sections_payload, owner=owner)

@app.route('/p/<slug>')
def public_portfolio(slug):
    with get_db() as db:
        p = db.execute("SELECT * FROM portfolios WHERE slug=? AND is_published=1", (slug,)).fetchone()
        if not p:
            return render_template('404.html'), 404

        if not is_probable_bot_ua(request.user_agent.string):
            db.execute("UPDATE portfolios SET views=views+1 WHERE id=?", (p['id'],))
            traffic = extract_traffic_context(request)
            db.execute(
                """INSERT INTO analytics(
                       id,portfolio_id,event_type,visitor_ip,user_agent,referrer,
                       source_label,utm_source,utm_medium,utm_campaign,created_at
                   ) VALUES(?,?,?,?,?,?,?,?,?,?,?)""",
                (
                    str(uuid.uuid4()),
                    p['id'],
                    'view',
                    get_request_ip(),
                    request.user_agent.string[:200],
                    traffic['referrer'],
                    traffic['source_label'],
                    traffic['utm_source'],
                    traffic['utm_medium'],
                    traffic['utm_campaign'],
                    utcnow().isoformat(),
                ),
            )
            db.commit()

        sections = db.execute(
            """SELECT * FROM portfolio_sections WHERE portfolio_id=? AND is_visible=1
               ORDER BY order_index""",
            (p['id'],),
        ).fetchall()
        owner = db.execute("SELECT name,email FROM users WHERE id=?", (p['user_id'],)).fetchone()

    return render_template('portfolio.html', portfolio=dict(p),
                           sections=[{**dict(s), 'content': parse_section_content(s['content'])} for s in sections],
                           owner=dict(owner) if owner else {})

@app.route('/p/<slug>/resume.pdf')
def download_resume_pdf(slug):
    with get_db() as db:
        p = db.execute("SELECT * FROM portfolios WHERE slug=? AND is_published=1", (slug,)).fetchone()
        if not p:
            return render_template('404.html'), 404

        sections = db.execute("""SELECT * FROM portfolio_sections WHERE portfolio_id=? AND is_visible=1
                                 ORDER BY order_index""", (p['id'],)).fetchall()
        owner = db.execute("SELECT name,email FROM users WHERE id=?", (p['user_id'],)).fetchone()
        resume_document = db.execute(
            """SELECT * FROM resume_documents
               WHERE user_id=?
               ORDER BY is_default DESC, updated_at DESC, created_at DESC
               LIMIT 1""",
            (p['user_id'],)
        ).fetchone()
        resume_profile = db.execute(
            "SELECT * FROM resume_profiles WHERE user_id=? LIMIT 1",
            (p['user_id'],)
        ).fetchone()

    portfolio_data = dict(p)
    owner_data = dict(owner) if owner else {}
    sections_data = [dict(s) for s in sections]

    if resume_document:
        resume_theme = get_resume_theme(resume_document['theme_id'])
        resume_content = normalize_resume_editor_content(
            parse_section_content(resume_document['content']),
            owner=owner_data,
        )
        pdf_bytes = build_resume_editor_pdf(
            owner_data,
            resume_content,
            theme_id=resume_theme['id'],
            resume_title=resume_document['title'],
            layout_mode=resume_content.get('layout_mode') or 'executive',
        )
        owner_name = resume_content.get('basics', {}).get('full_name') or owner_data.get('name') or 'developer'
    elif resume_profile:
        resume_theme = get_resume_theme(resume_profile['theme_id'])
        resume_content = normalize_resume_editor_content(
            parse_section_content(resume_profile['content']),
            owner=owner_data,
        )
        pdf_bytes = build_resume_editor_pdf(
            owner_data,
            resume_content,
            theme_id=resume_theme['id'],
            resume_title=resume_profile['title'],
            layout_mode=resume_content.get('layout_mode') or 'executive',
        )
        owner_name = resume_content.get('basics', {}).get('full_name') or owner_data.get('name') or 'developer'
    else:
        pdf_bytes = build_resume_pdf(owner_data, portfolio_data, sections_data)
        owner_name = owner_data.get('name') or 'developer'

    safe_name = re.sub(r'[^a-z0-9]+', '-', owner_name.lower()).strip('-') or 'resume'

    response = make_response(pdf_bytes)
    response.headers['Content-Type'] = 'application/pdf'
    response.headers['Content-Disposition'] = f'attachment; filename="{safe_name}-resume.pdf"'
    response.headers['Cache-Control'] = 'no-store'
    return response

PLAN_DISPLAY_ORDER = ['free', 'pro', 'team']
PLAN_CATALOG = {
    'free': {
        'name': 'Free',
        'description': 'Launch your portfolio and start getting visibility.',
        'monthly_inr': 0,
        'yearly_inr': 0,
        'popular': False,
        'badge': None,
        'limits': {'themes': 3, 'sections': 5, 'team_members': 1},
        'features': [
            'Core builder and publish',
            '3 curated themes',
            'Up to 5 sections',
            'Public portfolio URL',
            'GitHub Pages export'
        ]
    },
    'pro': {
        'name': 'Pro',
        'description': 'For active job seekers and senior individual developers.',
        'monthly_inr': 299,
        'yearly_inr': 2990,
        'popular': True,
        'badge': 'Most Popular',
        'limits': {'themes': 5, 'sections': 50, 'team_members': 1},
        'features': [
            'Everything in Free',
            'All premium themes',
            'Unlimited-like section flexibility',
            'Recruiter analytics dashboard',
            'Custom domain support',
            'Priority email support'
        ]
    },
    'team': {
        'name': 'Team',
        'description': 'For bootcamps, agencies, and developer teams.',
        'monthly_inr': 899,
        'yearly_inr': 8990,
        'popular': False,
        'badge': 'Scale',
        'limits': {'themes': 5, 'sections': 100, 'team_members': 10},
        'features': [
            'Everything in Pro',
            'Up to 10 members',
            'Team-ready template presets',
            'White-label options',
            'Shared billing visibility',
            'SLA-backed support'
        ]
    }
}
BILLING_CYCLE_DAYS = {'monthly': 30, 'yearly': 365}
CARD_BRAND_MAP = {
    'visa': 'Visa',
    'mastercard': 'Mastercard',
    'rupay': 'RuPay',
    'amex': 'Amex'
}


def normalize_plan_id(plan_id):
    pid = str(plan_id or 'free').strip().lower()
    return pid if pid in PLAN_CATALOG else 'free'


def normalize_billing_cycle(cycle):
    normalized = str(cycle or 'monthly').strip().lower()
    return normalized if normalized in BILLING_CYCLE_DAYS else 'monthly'


def serialize_plan(plan_id):
    pid = normalize_plan_id(plan_id)
    plan = PLAN_CATALOG[pid]
    yearly = int(plan.get('yearly_inr', 0))
    monthly = int(plan.get('monthly_inr', 0))
    yearly_monthly_equivalent = (yearly / 12.0) if yearly else 0
    discount_pct = 0
    if monthly > 0 and yearly > 0:
        annual_full = monthly * 12
        if annual_full > 0:
            discount_pct = max(int(round((1 - (yearly / annual_full)) * 100)), 0)
    return {
        'id': pid,
        'name': plan['name'],
        'description': plan['description'],
        'monthly_inr': monthly,
        'yearly_inr': yearly,
        'yearly_monthly_equivalent_inr': int(round(yearly_monthly_equivalent)),
        'yearly_discount_pct': discount_pct,
        'popular': bool(plan.get('popular')),
        'badge': plan.get('badge'),
        'limits': dict(plan.get('limits', {})),
        'features': list(plan.get('features', [])),
    }


def list_plan_catalog():
    return [serialize_plan(pid) for pid in PLAN_DISPLAY_ORDER]


def get_plan_price_inr(plan_id, billing_cycle):
    plan = serialize_plan(plan_id)
    if normalize_billing_cycle(billing_cycle) == 'yearly':
        return int(plan['yearly_inr'])
    return int(plan['monthly_inr'])


def ensure_user_subscription(db, user_id, fallback_plan='free'):
    existing = db.execute("SELECT * FROM subscriptions WHERE user_id=?", (user_id,)).fetchone()
    if existing:
        return existing, False

    now_dt = utcnow()
    now_iso = now_dt.isoformat()
    plan_id = normalize_plan_id(fallback_plan)
    cycle = 'monthly'
    period_end = ''
    if plan_id != 'free':
        period_end = (now_dt + timedelta(days=BILLING_CYCLE_DAYS[cycle])).isoformat()

    subscription_id = str(uuid.uuid4())
    db.execute(
        """INSERT INTO subscriptions(
               id,user_id,plan_id,billing_cycle,status,current_period_start,current_period_end,
               cancel_at_period_end,created_at,updated_at
           ) VALUES(?,?,?,?,?,?,?,?,?,?)""",
        (subscription_id, user_id, plan_id, cycle, 'active', now_iso, period_end, 0, now_iso, now_iso)
    )
    row = db.execute("SELECT * FROM subscriptions WHERE id=?", (subscription_id,)).fetchone()
    return row, True


def sanitize_card_brand(brand):
    raw = str(brand or '').strip().lower()
    if raw in CARD_BRAND_MAP:
        return CARD_BRAND_MAP[raw]
    if raw:
        return raw[:24].title()
    return 'Visa'


def sanitize_card_last4(last4):
    digits = re.sub(r'[^0-9]', '', str(last4 or ''))
    if len(digits) >= 4:
        return digits[-4:]
    return '4242'


def sanitize_exp_month(value):
    try:
        month = int(value)
    except Exception:
        return 12
    if 1 <= month <= 12:
        return month
    return 12


def sanitize_exp_year(value):
    current_year = utcnow().year
    try:
        year = int(value)
    except Exception:
        return current_year + 4
    if current_year <= year <= current_year + 20:
        return year
    return current_year + 4


def serialize_payment_method(row):
    if not row:
        return None
    return {
        'brand': str(row['brand'] or 'Visa'),
        'last4': str(row['last4'] or '4242'),
        'exp_month': int(row['exp_month'] or 12),
        'exp_year': int(row['exp_year'] or utcnow().year + 4),
        'updated_at': row['updated_at'],
    }


def upsert_payment_method(db, user_id, payload):
    data = payload if isinstance(payload, dict) else {}
    now_iso = utcnow().isoformat()
    brand = sanitize_card_brand(data.get('brand'))
    last4 = sanitize_card_last4(data.get('last4'))
    exp_month = sanitize_exp_month(data.get('exp_month'))
    exp_year = sanitize_exp_year(data.get('exp_year'))

    existing = db.execute("SELECT id FROM payment_methods WHERE user_id=?", (user_id,)).fetchone()
    if existing:
        db.execute(
            """UPDATE payment_methods
               SET brand=?, last4=?, exp_month=?, exp_year=?, updated_at=?
               WHERE user_id=?""",
            (brand, last4, exp_month, exp_year, now_iso, user_id)
        )
    else:
        db.execute(
            """INSERT INTO payment_methods(id,user_id,brand,last4,exp_month,exp_year,created_at,updated_at)
               VALUES(?,?,?,?,?,?,?,?)""",
            (str(uuid.uuid4()), user_id, brand, last4, exp_month, exp_year, now_iso, now_iso)
        )
    return db.execute(
        "SELECT brand,last4,exp_month,exp_year,updated_at FROM payment_methods WHERE user_id=?",
        (user_id,)
    ).fetchone()


def create_billing_invoice(db, user_id, plan_id, billing_cycle, amount_inr, status='paid', description=''):
    issued_at = utcnow().isoformat()
    invoice_id = str(uuid.uuid4())
    invoice_no = f"INV-{utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    paid_at = issued_at if status == 'paid' else ''
    db.execute(
        """INSERT INTO billing_invoices(
               id,invoice_no,user_id,plan_id,billing_cycle,amount_inr,currency,status,description,issued_at,paid_at
           ) VALUES(?,?,?,?,?,?,?,?,?,?,?)""",
        (
            invoice_id,
            invoice_no,
            user_id,
            normalize_plan_id(plan_id),
            normalize_billing_cycle(billing_cycle),
            int(amount_inr or 0),
            'INR',
            str(status or 'paid'),
            str(description or ''),
            issued_at,
            paid_at,
        )
    )
    return db.execute("SELECT * FROM billing_invoices WHERE id=?", (invoice_id,)).fetchone()


def serialize_invoice(row):
    if not row:
        return None
    amount_inr = int(row['amount_inr'] or 0)
    return {
        'id': row['id'],
        'invoice_no': row['invoice_no'],
        'plan_id': normalize_plan_id(row['plan_id']),
        'billing_cycle': normalize_billing_cycle(row['billing_cycle']),
        'amount_inr': amount_inr,
        'currency': row['currency'] or 'INR',
        'status': row['status'] or 'paid',
        'description': row['description'] or '',
        'issued_at': row['issued_at'],
        'paid_at': row['paid_at'] or None,
    }


def serialize_subscription(row):
    if not row:
        return {
            'plan_id': 'free',
            'billing_cycle': 'monthly',
            'status': 'active',
            'cancel_at_period_end': False,
            'current_period_start': None,
            'current_period_end': None,
            'plan': serialize_plan('free')
        }

    plan_id = normalize_plan_id(row['plan_id'])
    return {
        'plan_id': plan_id,
        'billing_cycle': normalize_billing_cycle(row['billing_cycle']),
        'status': row['status'] or 'active',
        'cancel_at_period_end': bool(row['cancel_at_period_end']),
        'current_period_start': row['current_period_start'] or None,
        'current_period_end': row['current_period_end'] or None,
        'plan': serialize_plan(plan_id),
    }


def fetch_billing_snapshot(db, user_id, fallback_plan='free'):
    subscription_row, created = ensure_user_subscription(db, user_id, fallback_plan)
    if created:
        db.commit()

    payment_method_row = db.execute(
        "SELECT brand,last4,exp_month,exp_year,updated_at FROM payment_methods WHERE user_id=?",
        (user_id,)
    ).fetchone()
    invoice_rows = db.execute(
        """SELECT * FROM billing_invoices
           WHERE user_id=?
           ORDER BY issued_at DESC
           LIMIT 12""",
        (user_id,)
    ).fetchall()

    subscription = serialize_subscription(subscription_row)
    return {
        'subscription': subscription,
        'payment_method': serialize_payment_method(payment_method_row),
        'invoices': [serialize_invoice(row) for row in invoice_rows],
        'plans': list_plan_catalog(),
    }


MAX_TEMPLATE_NAME_LENGTH = 72
MAX_TEMPLATE_DESCRIPTION_LENGTH = 420
MAX_TEMPLATE_SNAPSHOT_BYTES = 450000
VALID_PORTFOLIO_SECTION_TYPES = {
    'hero', 'about', 'skills', 'projects', 'experience', 'education',
    'stats', 'timeline', 'testimonials', 'contact'
}


def parse_bool(value):
    if isinstance(value, bool):
        return value
    return str(value or '').strip().lower() in {'1', 'true', 'yes', 'on'}


def normalize_template_category(value):
    raw = re.sub(r'[^a-z0-9-]+', '-', str(value or 'general').strip().lower()).strip('-')
    if not raw:
        raw = 'general'
    return raw[:24]


def parse_template_sections_config(raw_config):
    payload = parse_section_content(raw_config)
    sections_raw = payload.get('sections') if isinstance(payload.get('sections'), list) else []
    data_raw = payload.get('data') if isinstance(payload.get('data'), dict) else {}

    normalized_sections = []
    seen = set()
    for item in sections_raw:
        if not isinstance(item, dict):
            continue
        sid = str(item.get('id') or '').strip().lower()
        if sid not in VALID_PORTFOLIO_SECTION_TYPES:
            continue
        if not sid or sid in seen:
            continue
        seen.add(sid)
        normalized_sections.append({'id': sid, 'visible': bool(item.get('visible', True))})

    return {'sections': normalized_sections, 'data': data_raw}


def can_access_template_row(template_row, viewer=None):
    if not template_row:
        return False

    status = str(template_row['approval_status'] or 'approved').strip().lower()
    is_public = bool(template_row['is_public'])
    owner_id = str(template_row['created_by_user_id'] or '').strip()

    if is_public and status == 'approved':
        return True
    if viewer and owner_id and owner_id == str(viewer['id']):
        return True
    if viewer and is_admin_user(viewer):
        return True
    return False


def serialize_template_row(row, viewer=None, include_sections=False):
    viewer_id = str(viewer['id']) if viewer else ''
    owner_id = str(row['created_by_user_id'] or '').strip()
    is_owner = bool(viewer_id and owner_id and owner_id == viewer_id)
    is_admin_viewer = bool(viewer and is_admin_user(viewer))
    status = str(row['approval_status'] or 'approved').strip().lower() or 'approved'
    theme = str(row['theme'] or 'cyberpunk').strip() or 'cyberpunk'

    payload = {
        'id': row['id'],
        'name': str(row['name'] or '').strip(),
        'description': str(row['description'] or '').strip(),
        'theme': theme,
        'category': normalize_template_category(row['category']),
        'preview_image': str(row['preview_image'] or '').strip(),
        'demo_url': str(row['demo_url'] or '').strip() or f"/demo/{theme}",
        'is_featured': bool(row['is_featured']),
        'uses': int(row['uses'] or 0),
        'is_public': bool(row['is_public']),
        'approval_status': status,
        'moderation_note': str(row['moderation_note'] or '').strip(),
        'created_at': row['created_at'] or None,
        'updated_at': row['updated_at'] or None,
        'creator_name': str(row['creator_name'] if 'creator_name' in row.keys() else '').strip(),
        'is_owner': is_owner,
    }

    if is_owner or is_admin_viewer:
        payload['created_by_user_id'] = owner_id

    if include_sections:
        payload['sections_config'] = parse_template_sections_config(row['sections_config'])

    return payload


def build_template_snapshot_from_portfolio(db, user_id):
    portfolio = db.execute(
        "SELECT id,slug,theme,is_published FROM portfolios WHERE user_id=? ORDER BY created_at DESC LIMIT 1",
        (user_id,)
    ).fetchone()
    if not portfolio:
        return None, None

    section_rows = db.execute(
        """SELECT section_type,content,is_visible,order_index
           FROM portfolio_sections
           WHERE portfolio_id=?
           ORDER BY order_index ASC""",
        (portfolio['id'],)
    ).fetchall()

    sections = []
    data_map = {}
    for row in section_rows:
        sid = str(row['section_type'] or '').strip().lower()
        if sid not in VALID_PORTFOLIO_SECTION_TYPES:
            continue
        if not sid:
            continue
        sections.append({'id': sid, 'visible': bool(row['is_visible'])})
        data_map[sid] = parse_section_content(row['content'])

    return dict(portfolio), {'sections': sections, 'data': data_map}


def delete_user_account_and_related(db, user_id):
    portfolio_rows = db.execute("SELECT id FROM portfolios WHERE user_id=?", (user_id,)).fetchall()
    portfolio_ids = [row['id'] for row in portfolio_rows]

    for portfolio_id in portfolio_ids:
        db.execute("DELETE FROM portfolio_sections WHERE portfolio_id=?", (portfolio_id,))
        db.execute("DELETE FROM contacts WHERE portfolio_id=?", (portfolio_id,))
        db.execute("DELETE FROM chatbot_logs WHERE portfolio_id=?", (portfolio_id,))
        db.execute("DELETE FROM analytics WHERE portfolio_id=?", (portfolio_id,))

    db.execute("DELETE FROM portfolios WHERE user_id=?", (user_id,))
    db.execute("DELETE FROM design_presets WHERE user_id=?", (user_id,))
    db.execute("DELETE FROM subscriptions WHERE user_id=?", (user_id,))
    db.execute("DELETE FROM payment_methods WHERE user_id=?", (user_id,))
    db.execute("DELETE FROM billing_invoices WHERE user_id=?", (user_id,))
    db.execute("DELETE FROM templates WHERE created_by_user_id=?", (user_id,))
    db.execute("DELETE FROM users WHERE id=?", (user_id,))

ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'gif'}
MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024
MAX_PRESET_NAME_LENGTH = 64
MAX_PRESET_SNAPSHOT_BYTES = 120000

@app.route('/api/upload/image', methods=['POST'])
@login_required
def upload_image(current_user):
    if request.content_length and request.content_length > MAX_UPLOAD_SIZE_BYTES:
        return jsonify({'error': 'Image too large. Max size is 5 MB.'}), 413

    file = request.files.get('file')
    if not file or not file.filename:
        return jsonify({'error': 'No image file uploaded'}), 400

    ext = os.path.splitext(file.filename)[1].lower().lstrip('.')
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        return jsonify({'error': 'Unsupported image format. Use PNG, JPG, JPEG, WEBP, or GIF.'}), 400

    mime = (file.mimetype or '').lower()
    if mime and not mime.startswith('image/'):
        return jsonify({'error': 'Only image files are allowed'}), 400

    upload_dir = os.path.join(BASE_DIR, 'static', 'uploads')
    os.makedirs(upload_dir, exist_ok=True)

    username_seed = re.sub(r'[^a-z0-9-]', '-', (current_user['username'] or 'user').lower()).strip('-') or 'user'
    saved_name = f"{username_seed}-{uuid.uuid4().hex[:12]}.{ext}"
    saved_path = os.path.join(upload_dir, saved_name)
    file.save(saved_path)

    return jsonify({'success': True, 'url': f'/static/uploads/{saved_name}'})

@app.route('/api/design-presets', methods=['GET'])
@login_required
def list_design_presets(current_user):
    with get_db() as db:
        rows = db.execute(
            """SELECT id,name,snapshot,created_at,updated_at
               FROM design_presets
               WHERE user_id=?
               ORDER BY LOWER(name) ASC""",
            (current_user['id'],)
        ).fetchall()

    presets = []
    for row in rows:
        presets.append({
            'id': row['id'],
            'name': row['name'],
            'snapshot': parse_section_content(row['snapshot']),
            'created_at': row['created_at'],
            'updated_at': row['updated_at'],
        })

    return jsonify({'presets': presets})

@app.route('/api/design-presets', methods=['POST'])
@login_required
def upsert_design_preset(current_user):
    data = request.get_json(silent=True) or {}
    name = str(data.get('name', '') or '').strip()
    snapshot = data.get('snapshot')

    if not name:
        return jsonify({'error': 'Preset name is required'}), 400
    if len(name) > MAX_PRESET_NAME_LENGTH:
        return jsonify({'error': f'Preset name must be {MAX_PRESET_NAME_LENGTH} characters or less'}), 400
    if not isinstance(snapshot, dict):
        return jsonify({'error': 'Preset snapshot must be an object'}), 400

    try:
        snapshot_json = json.dumps(snapshot)
    except Exception:
        return jsonify({'error': 'Preset snapshot is not JSON serializable'}), 400

    if len(snapshot_json.encode('utf-8')) > MAX_PRESET_SNAPSHOT_BYTES:
        return jsonify({'error': 'Preset is too large'}), 413

    now = utcnow().isoformat()
    preset_id = None

    with get_db() as db:
        existing = db.execute(
            "SELECT id FROM design_presets WHERE user_id=? AND name=?",
            (current_user['id'], name)
        ).fetchone()

        if existing:
            preset_id = existing['id']
            db.execute(
                "UPDATE design_presets SET snapshot=?, updated_at=? WHERE id=?",
                (snapshot_json, now, preset_id)
            )
        else:
            preset_id = str(uuid.uuid4())
            db.execute(
                """INSERT INTO design_presets(id,user_id,name,snapshot,created_at,updated_at)
                   VALUES(?,?,?,?,?,?)""",
                (preset_id, current_user['id'], name, snapshot_json, now, now)
            )
        db.commit()

        row = db.execute(
            "SELECT id,name,snapshot,created_at,updated_at FROM design_presets WHERE id=?",
            (preset_id,)
        ).fetchone()

    return jsonify({
        'success': True,
        'preset': {
            'id': row['id'],
            'name': row['name'],
            'snapshot': parse_section_content(row['snapshot']),
            'created_at': row['created_at'],
            'updated_at': row['updated_at'],
        }
    })

@app.route('/api/design-presets/<preset_id>', methods=['DELETE'])
@login_required
def delete_design_preset(current_user, preset_id):
    pid = str(preset_id or '').strip()
    if not pid:
        return jsonify({'error': 'Preset id is required'}), 400

    with get_db() as db:
        result = db.execute(
            "DELETE FROM design_presets WHERE id=? AND user_id=?",
            (pid, current_user['id'])
        )
        db.commit()

    if result.rowcount < 1:
        return jsonify({'error': 'Preset not found'}), 404
    return jsonify({'success': True})


@app.route('/api/resume/editor', methods=['GET'])
@login_required
def get_resume_editor_profile(current_user):
    owner_defaults = {'name': current_user['name'], 'email': current_user['email']}
    requested_resume_id = request.args.get('resume_id')

    with get_db() as db:
        ensure_resume_documents_for_user(db, current_user)
        db.commit()
        rows = get_resume_documents_for_user(db, current_user['id'])
        active_row = select_active_resume_document(rows, requested_resume_id)

    if not active_row:
        return jsonify({'error': 'Unable to load resume profile'}), 500

    serialized_docs = serialize_resume_documents(rows, owner_defaults=owner_defaults)
    serialized_active = serialize_resume_document(active_row, owner_defaults=owner_defaults)

    return jsonify({
        'success': True,
        'profile': serialized_active,
        'profiles': serialized_docs,
        'resumes': serialized_docs,
        'active_resume_id': serialized_active['id'],
        'themes': RESUME_THEME_CATALOG,
    })


@app.route('/api/resume/editor', methods=['PUT'])
@login_required
def update_resume_editor_profile(current_user):
    payload = request.get_json(silent=True) or {}
    owner_defaults = {'name': current_user['name'], 'email': current_user['email']}
    requested_resume_id = payload.get('resume_id') or request.args.get('resume_id')

    with get_db() as db:
        rows = ensure_resume_documents_for_user(db, current_user)
        active_row = select_active_resume_document(rows, requested_resume_id)
        if not active_row:
            return jsonify({'error': 'Resume profile not found'}), 404

        update_payload = {
            'title': payload.get('title'),
            'theme_id': payload.get('theme_id'),
            'content': payload.get('content') if isinstance(payload.get('content'), dict) else parse_section_content(active_row['content']),
            'is_default': payload.get('is_default') is True or payload.get('set_default') is True,
        }
        updated_row = update_resume_document(db, current_user, active_row['id'], update_payload)
        if not updated_row:
            return jsonify({'error': 'Unable to update resume profile'}), 500

        if payload.get('set_default') is True:
            set_default_resume_document(db, current_user['id'], updated_row['id'])

        db.commit()
        rows = get_resume_documents_for_user(db, current_user['id'])
        updated_row = get_resume_document_by_id(db, current_user['id'], updated_row['id']) or select_active_resume_document(rows)

    serialized_docs = serialize_resume_documents(rows, owner_defaults=owner_defaults)
    serialized_active = serialize_resume_document(updated_row, owner_defaults=owner_defaults)

    return jsonify({
        'success': True,
        'profile': serialized_active,
        'profiles': serialized_docs,
        'resumes': serialized_docs,
        'active_resume_id': serialized_active['id'],
        'themes': RESUME_THEME_CATALOG,
    })


@app.route('/api/resume/editor/documents', methods=['POST'])
@login_required
def create_resume_editor_document(current_user):
    payload = request.get_json(silent=True) or {}
    owner_defaults = {'name': current_user['name'], 'email': current_user['email']}

    with get_db() as db:
        ensure_resume_documents_for_user(db, current_user)

        source_row = None
        source_resume_id = payload.get('source_resume_id')
        if source_resume_id:
            source_row = get_resume_document_by_id(db, current_user['id'], source_resume_id)

        create_from_portfolio = payload.get('from_portfolio') is True
        if create_from_portfolio:
            seed_content = build_resume_seed_content_for_user(db, current_user)
            default_title = 'Portfolio Resume'
            default_theme = payload.get('theme_id') or DEFAULT_RESUME_THEME_ID
        elif source_row:
            seed_content = parse_section_content(source_row['content'])
            default_title = f"{clean_resume_text(source_row['title'], max_len=70, default='Resume')} Copy"
            default_theme = payload.get('theme_id') or source_row['theme_id']
        else:
            seed_content = normalize_resume_editor_content({}, owner=owner_defaults)
            default_title = 'New Resume'
            default_theme = payload.get('theme_id') or DEFAULT_RESUME_THEME_ID

        created_row = create_resume_document(
            db,
            current_user,
            title=payload.get('title') or default_title,
            theme_id=default_theme,
            content=seed_content,
            make_default=payload.get('make_default') is True or payload.get('is_default') is True,
        )

        db.commit()
        rows = get_resume_documents_for_user(db, current_user['id'])
        active_row = get_resume_document_by_id(db, current_user['id'], created_row['id']) or select_active_resume_document(rows)

    serialized_docs = serialize_resume_documents(rows, owner_defaults=owner_defaults)
    serialized_active = serialize_resume_document(active_row, owner_defaults=owner_defaults)
    return jsonify({
        'success': True,
        'profile': serialized_active,
        'profiles': serialized_docs,
        'resumes': serialized_docs,
        'active_resume_id': serialized_active['id'],
        'themes': RESUME_THEME_CATALOG,
    })


@app.route('/api/resume/editor/import-portfolio', methods=['POST'])
@login_required
def import_resume_editor_document_from_portfolio(current_user):
    payload = request.get_json(silent=True) or {}
    owner_defaults = {'name': current_user['name'], 'email': current_user['email']}

    with get_db() as db:
        ensure_resume_documents_for_user(db, current_user)
        seed_content = build_resume_seed_content_for_user(db, current_user)
        created_row = create_resume_document(
            db,
            current_user,
            title=payload.get('title') or 'Portfolio Resume',
            theme_id=payload.get('theme_id') or DEFAULT_RESUME_THEME_ID,
            content=seed_content,
            make_default=payload.get('make_default') is True,
        )

        db.commit()
        rows = get_resume_documents_for_user(db, current_user['id'])
        active_row = get_resume_document_by_id(db, current_user['id'], created_row['id']) or select_active_resume_document(rows)

    serialized_docs = serialize_resume_documents(rows, owner_defaults=owner_defaults)
    serialized_active = serialize_resume_document(active_row, owner_defaults=owner_defaults)
    return jsonify({
        'success': True,
        'profile': serialized_active,
        'profiles': serialized_docs,
        'resumes': serialized_docs,
        'active_resume_id': serialized_active['id'],
        'themes': RESUME_THEME_CATALOG,
    })


@app.route('/api/resume/editor/documents/<resume_id>/default', methods=['POST'])
@login_required
def set_resume_editor_document_default(current_user, resume_id):
    owner_defaults = {'name': current_user['name'], 'email': current_user['email']}

    with get_db() as db:
        ensure_resume_documents_for_user(db, current_user)
        selected_id = set_default_resume_document(db, current_user['id'], resume_id)
        if not selected_id:
            return jsonify({'error': 'Resume not found'}), 404

        db.commit()
        rows = get_resume_documents_for_user(db, current_user['id'])
        active_row = select_active_resume_document(rows, selected_id)

    serialized_docs = serialize_resume_documents(rows, owner_defaults=owner_defaults)
    serialized_active = serialize_resume_document(active_row, owner_defaults=owner_defaults)
    return jsonify({
        'success': True,
        'profile': serialized_active,
        'profiles': serialized_docs,
        'resumes': serialized_docs,
        'active_resume_id': serialized_active['id'],
        'themes': RESUME_THEME_CATALOG,
    })


@app.route('/api/resume/editor/documents/<resume_id>', methods=['DELETE'])
@login_required
def delete_resume_editor_document(current_user, resume_id):
    owner_defaults = {'name': current_user['name'], 'email': current_user['email']}

    with get_db() as db:
        ensure_resume_documents_for_user(db, current_user)
        target = get_resume_document_by_id(db, current_user['id'], resume_id)
        if not target:
            return jsonify({'error': 'Resume not found'}), 404

        db.execute(
            "DELETE FROM resume_documents WHERE id=? AND user_id=?",
            (target['id'], current_user['id'])
        )

        rows = get_resume_documents_for_user(db, current_user['id'])
        if not rows:
            fallback = create_resume_document(
                db,
                current_user,
                title='Primary Resume',
                theme_id=DEFAULT_RESUME_THEME_ID,
                content=normalize_resume_editor_content({}, owner=owner_defaults),
                make_default=True,
            )
            rows = [fallback]

        ensure_default_resume_document(db, current_user['id'])
        db.commit()
        rows = get_resume_documents_for_user(db, current_user['id'])
        active_row = select_active_resume_document(rows)

    serialized_docs = serialize_resume_documents(rows, owner_defaults=owner_defaults)
    serialized_active = serialize_resume_document(active_row, owner_defaults=owner_defaults)
    return jsonify({
        'success': True,
        'profile': serialized_active,
        'profiles': serialized_docs,
        'resumes': serialized_docs,
        'active_resume_id': serialized_active['id'],
        'themes': RESUME_THEME_CATALOG,
    })


@app.route('/api/resume/editor/pdf', methods=['POST'])
@login_required
def download_resume_editor_pdf(current_user):
    payload = request.get_json(silent=True) or {}
    owner_defaults = {'name': current_user['name'], 'email': current_user['email']}
    requested_resume_id = payload.get('resume_id') or request.args.get('resume_id')

    with get_db() as db:
        rows = ensure_resume_documents_for_user(db, current_user)
        db.commit()
        profile_row = select_active_resume_document(rows, requested_resume_id)

    if not profile_row:
        return jsonify({'error': 'Resume profile not found'}), 404

    payload_content = payload.get('content') if isinstance(payload.get('content'), dict) else None
    content_source = payload_content if payload_content is not None else parse_section_content(profile_row['content'])
    normalized_content = normalize_resume_editor_content(content_source, owner=owner_defaults)

    selected_theme = get_resume_theme(payload.get('theme_id') or profile_row['theme_id'])
    resume_title = clean_resume_text(payload.get('title') or profile_row['title'] or 'Resume', max_len=80, default='Resume')
    layout_mode = normalize_resume_layout_mode(payload.get('layout_mode') or normalized_content.get('layout_mode'), default='executive')
    pdf_bytes = build_resume_editor_pdf(
        owner_defaults,
        normalized_content,
        theme_id=selected_theme['id'],
        resume_title=resume_title,
        layout_mode=layout_mode,
    )

    owner_name = normalized_content.get('basics', {}).get('full_name') or current_user['name'] or 'developer'
    safe_name = re.sub(r'[^a-z0-9]+', '-', str(owner_name).lower()).strip('-') or 'resume'

    response = make_response(pdf_bytes)
    response.headers['Content-Type'] = 'application/pdf'
    response.headers['Content-Disposition'] = f'attachment; filename="{safe_name}-resume-editor.pdf"'
    response.headers['Cache-Control'] = 'no-store'
    return response

@app.route('/api/resume/tailor', methods=['POST'])
@login_required
def tailor_resume(current_user):
    payload = request.get_json(silent=True) or {}

    try:
        job_text, job_url = resolve_tailor_job_text(payload)
    except RuntimeError as exc:
        return jsonify({'error': str(exc)}), 400

    portfolio_data, sections_data, owner_data = get_latest_user_portfolio_bundle(current_user['id'])
    if not portfolio_data:
        return jsonify({'error': 'No portfolio found for current user'}), 404

    tailoring = build_resume_tailoring(owner_data, portfolio_data, sections_data, job_text, job_url=job_url)
    return jsonify({'success': True, 'tailoring': tailoring})


@app.route('/api/resume/tailored-pdf', methods=['POST'])
@login_required
def download_tailored_resume_pdf(current_user):
    payload = request.get_json(silent=True) or {}

    try:
        job_text, job_url = resolve_tailor_job_text(payload)
    except RuntimeError as exc:
        return jsonify({'error': str(exc)}), 400

    portfolio_data, sections_data, owner_data = get_latest_user_portfolio_bundle(current_user['id'])
    if not portfolio_data:
        return jsonify({'error': 'No portfolio found for current user'}), 404

    tailoring = build_resume_tailoring(owner_data, portfolio_data, sections_data, job_text, job_url=job_url)
    pdf_bytes = build_resume_pdf(
        owner_data,
        portfolio_data,
        sections_data,
        tailoring=tailoring,
        layout_mode=payload.get('layout_mode') or 'executive',
    )

    owner_name = owner_data.get('name') or current_user['name'] or 'developer'
    safe_name = re.sub(r'[^a-z0-9]+', '-', str(owner_name).lower()).strip('-') or 'resume'

    response = make_response(pdf_bytes)
    response.headers['Content-Type'] = 'application/pdf'
    response.headers['Content-Disposition'] = f'attachment; filename="{safe_name}-tailored-resume.pdf"'
    response.headers['Cache-Control'] = 'no-store'
    return response

# ─────────────────────────────────────────────
# API — AUTH
# ─────────────────────────────────────────────
@app.route('/api/auth/signup', methods=['POST'])
def api_signup():
    data = request.get_json(silent=True) or {}
    if not isinstance(data, dict):
        return jsonify({'error': 'Invalid JSON payload'}), 400

    client_ip = get_request_ip()
    if is_rate_limited(f'auth:signup:ip:{client_ip}', limit=12, window_seconds=900):
        return jsonify({'error': 'Too many signup attempts. Please try again in a few minutes.'}), 429

    name = (data.get('name','') or '').strip()
    email = (data.get('email','') or '').strip().lower()
    password = data.get('password','') or ''
    requested_username = (data.get('username','') or re.sub(r'[^a-z0-9]','', email.split('@')[0])[:20]).strip().lower()

    if email and is_rate_limited(f'auth:signup:email:{email}', limit=4, window_seconds=3600):
        return jsonify({'error': 'Too many signup attempts for this email. Please try later.'}), 429

    if not name or not email or not password:
        return jsonify({'error': 'Name, email and password are required'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    if not re.match(r'^[^@]+@[^@]+\.[^@]+$', email):
        return jsonify({'error': 'Invalid email address'}), 400

    with get_db() as db:
        if db.execute("SELECT id FROM users WHERE email=?", (email,)).fetchone():
            return jsonify({'error': 'Email already registered'}), 409

        username = build_unique_username(db, requested_username)

        uid = str(uuid.uuid4())
        now = utcnow().isoformat()
        is_admin = 1 if is_admin_email(email) else 0
        db.execute("""INSERT INTO users(id,email,username,password_hash,name,is_admin,created_at,last_login)
                      VALUES(?,?,?,?,?,?,?,?)""",
                   (uid, email, username, hash_password(password), name, is_admin, now, now))

        create_default_portfolio(db, uid, name, email, username)
        ensure_admin_access(db, preferred_user_id=uid, preferred_email=email)
        db.commit()

        created_user = db.execute("SELECT * FROM users WHERE id=?", (uid,)).fetchone()

    token = create_token(uid)
    resp = jsonify({
        'success': True,
        'user': {
            'id': uid,
            'name': name,
            'email': email,
            'username': username,
            'is_admin': bool(created_user['is_admin']) if created_user else bool(is_admin)
        },
        'redirect': '/dashboard'
    })
    set_auth_cookie(resp, token)
    return resp, 201

@app.route('/api/auth/login', methods=['POST'])
def api_login():
    data = request.get_json(silent=True) or {}
    if not isinstance(data, dict):
        return jsonify({'error': 'Invalid JSON payload'}), 400

    client_ip = get_request_ip()
    if is_rate_limited(f'auth:login:ip:{client_ip}', limit=25, window_seconds=900):
        return jsonify({'error': 'Too many login attempts. Please wait before retrying.'}), 429

    email = (data.get('email','') or '').strip().lower()
    password = data.get('password','') or ''
    if email and is_rate_limited(f'auth:login:email:{email}:{client_ip}', limit=12, window_seconds=900):
        return jsonify({'error': 'Too many login attempts for this account. Please wait and retry.'}), 429

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
    with get_db() as db:
        user = db.execute("SELECT * FROM users WHERE email=? AND provider='email'", (email,)).fetchone()
        if not user or not verify_password(user['password_hash'], password):
            return jsonify({'error': 'Invalid email or password'}), 401
        db.execute("UPDATE users SET last_login=? WHERE id=?", (utcnow().isoformat(), user['id']))
        ensure_admin_access(db, preferred_user_id=user['id'], preferred_email=user['email'])
        db.commit()
        user = db.execute("SELECT * FROM users WHERE id=?", (user['id'],)).fetchone()
    token = create_token(user['id'])
    resp = jsonify({
        'success': True,
        'user': {
            'id': user['id'],
            'name': user['name'],
            'email': user['email'],
            'username': user['username'],
            'is_admin': bool(user['is_admin'])
        },
        'redirect': '/dashboard'
    })
    set_auth_cookie(resp, token)
    return resp


@app.route('/api/auth/password-reset/request', methods=['POST'])
def api_password_reset_request():
    data = request.get_json(silent=True) or {}
    if not isinstance(data, dict):
        return jsonify({'error': 'Invalid JSON payload'}), 400

    client_ip = get_request_ip()
    if is_rate_limited(f'auth:reset:request:ip:{client_ip}', limit=12, window_seconds=900):
        return jsonify({'error': 'Too many reset requests. Please try again shortly.'}), 429

    email = str(data.get('email', '') or '').strip().lower()
    if not re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', email):
        return jsonify({'error': 'Please provide a valid email address'}), 400

    generic_message = 'If an account exists for this email, a password reset code has been sent.'
    payload = {'success': True, 'message': generic_message}

    with get_db() as db:
        user = db.execute(
            "SELECT id,name,email,provider,is_active FROM users WHERE email=? LIMIT 1",
            (email,),
        ).fetchone()

        valid_user = bool(user) and str(user['provider'] or '') == 'email' and bool(int(user['is_active']))
        if not valid_user:
            return jsonify(payload)

        if is_rate_limited(f'auth:reset:request:email:{email}', limit=6, window_seconds=3600):
            return jsonify(payload)

        code = create_password_reset_code()
        code_hash = hash_password_reset_code(email, code)
        now_dt = utcnow()
        now_iso = now_dt.isoformat()
        expires_iso = (now_dt + timedelta(minutes=PASSWORD_RESET_TTL_MINUTES)).isoformat()

        db.execute(
            "DELETE FROM password_reset_tokens WHERE user_id=? OR expires_at < ? OR COALESCE(used_at,'') != ''",
            (user['id'], now_iso),
        )
        db.execute(
            """INSERT INTO password_reset_tokens(id,user_id,email,token_hash,expires_at,used_at,created_at,request_ip)
               VALUES(?,?,?,?,?,?,?,?)""",
            (str(uuid.uuid4()), user['id'], email, code_hash, expires_iso, '', now_iso, client_ip),
        )
        db.commit()

    sent = send_password_reset_email(email, user['name'], code)
    if not sent and not IS_PRODUCTION:
        # Development fallback so local testing works without SMTP setup.
        payload['message'] = 'Development mode: use the generated reset code below.'
        payload['dev_reset_code'] = code
        payload['dev_expires_minutes'] = PASSWORD_RESET_TTL_MINUTES

    return jsonify(payload)


@app.route('/api/auth/password-reset/confirm', methods=['POST'])
def api_password_reset_confirm():
    data = request.get_json(silent=True) or {}
    if not isinstance(data, dict):
        return jsonify({'error': 'Invalid JSON payload'}), 400

    client_ip = get_request_ip()
    if is_rate_limited(f'auth:reset:confirm:ip:{client_ip}', limit=20, window_seconds=900):
        return jsonify({'error': 'Too many attempts. Please try again later.'}), 429

    email = str(data.get('email', '') or '').strip().lower()
    code = re.sub(r'[^0-9A-Za-z]+', '', str(data.get('code', '') or '').strip())
    new_password = str(data.get('new_password', '') or '')

    if not email or not code or not new_password:
        return jsonify({'error': 'Email, reset code, and new password are required'}), 400
    if not re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', email):
        return jsonify({'error': 'Please provide a valid email address'}), 400
    if len(new_password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    if len(new_password) > 128:
        return jsonify({'error': 'Password is too long'}), 400

    now_iso = utcnow().isoformat()
    token_hash = hash_password_reset_code(email, code)

    with get_db() as db:
        user = db.execute(
            "SELECT id,email,provider,is_active FROM users WHERE email=? LIMIT 1",
            (email,),
        ).fetchone()
        valid_user = bool(user) and str(user['provider'] or '') == 'email' and bool(int(user['is_active']))
        if not valid_user:
            return jsonify({'error': 'Invalid or expired reset code'}), 400

        token_row = db.execute(
            """SELECT id FROM password_reset_tokens
               WHERE user_id=? AND email=? AND token_hash=?
                 AND COALESCE(used_at,'')='' AND expires_at>=?
               ORDER BY created_at DESC
               LIMIT 1""",
            (user['id'], email, token_hash, now_iso),
        ).fetchone()

        if not token_row:
            return jsonify({'error': 'Invalid or expired reset code'}), 400

        db.execute("UPDATE users SET password_hash=?, last_login=? WHERE id=?", (hash_password(new_password), now_iso, user['id']))
        db.execute("UPDATE password_reset_tokens SET used_at=? WHERE user_id=? AND COALESCE(used_at,'')=''", (now_iso, user['id']))
        db.commit()

    return jsonify({'success': True, 'message': 'Password updated. You can now sign in with your new password.'})

@app.route('/api/auth/logout', methods=['POST'])
def api_logout():
    resp = jsonify({'success': True})
    resp.delete_cookie('token', path='/')
    return resp

@app.route('/api/auth/me')
def api_me():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Not authenticated'}), 401
    with get_db() as db:
        ensure_admin_access(db, preferred_user_id=user['id'], preferred_email=user['email'])
        portfolios = db.execute("SELECT id,slug,title,theme,is_published,views FROM portfolios WHERE user_id=?", (user['id'],)).fetchall()
        contacts_count = db.execute("""SELECT COUNT(*) as c FROM contacts c
                                       JOIN portfolios p ON c.portfolio_id=p.id
                                       WHERE p.user_id=? AND c.is_read=0""", (user['id'],)).fetchone()['c']
        subscription_row, _created = ensure_user_subscription(db, user['id'], user['plan'])
        db.commit()
        user = db.execute("SELECT * FROM users WHERE id=?", (user['id'],)).fetchone()

    resolved_plan = normalize_plan_id(subscription_row['plan_id']) if subscription_row else normalize_plan_id(user['plan'])
    billing_cycle = normalize_billing_cycle(subscription_row['billing_cycle']) if subscription_row else 'monthly'
    renews_at = subscription_row['current_period_end'] if subscription_row and subscription_row['current_period_end'] else None
    cancel_at_period_end = bool(subscription_row['cancel_at_period_end']) if subscription_row else False
    subscription_status = subscription_row['status'] if subscription_row else 'active'

    return jsonify({
        'id': user['id'], 'name': user['name'], 'email': user['email'],
        'username': user['username'], 'bio': user['bio'], 'avatar': user['avatar'],
        'is_admin': bool(user['is_admin']),
        'plan': resolved_plan, 'portfolio_views': user['portfolio_views'],
        'billing_cycle': billing_cycle,
        'plan_renews_at': renews_at,
        'cancel_at_period_end': cancel_at_period_end,
        'subscription_status': subscription_status,
        'unread_contacts': contacts_count,
        'portfolios': [dict(p) for p in portfolios]
    })

# Social auth start endpoint
@app.route('/api/auth/social/<provider>')
def social_auth(provider):
    oauth_cfg = get_oauth_provider(provider)
    if not oauth_cfg:
        return jsonify({'error': 'Unknown provider'}), 400

    provider = oauth_cfg['key']

    # Developer-friendly fallback: if OAuth keys are not set, sign in with a local demo account.
    if not oauth_cfg['client_id'] or not oauth_cfg['client_secret']:
        demo_profile = {
            'provider_id': f'{provider}-demo',
            'email': f'{provider}.demo@quickfolio.app',
            'name': f"{oauth_cfg['display_name']} User",
            'username_seed': f'{provider}_demo'
        }
        user = find_or_create_social_user(provider, demo_profile)
        return issue_auth_cookie_redirect(user)

    state = secrets.token_urlsafe(24)
    session['oauth_state'] = state
    session['oauth_provider'] = provider
    session['oauth_started_at'] = int(time.time())

    redirect_uri = url_for('social_auth_callback', provider=provider, _external=True)
    params = {
        'client_id': oauth_cfg['client_id'],
        'redirect_uri': redirect_uri,
        'response_type': 'code',
        'scope': oauth_cfg['scope'],
        'state': state
    }

    if provider == 'github':
        params.pop('response_type', None)
        params['allow_signup'] = 'true'
    elif provider == 'google':
        params['access_type'] = 'online'
        params['prompt'] = 'consent'

    return redirect(f"{oauth_cfg['auth_url']}?{urlencode(params)}")

@app.route('/api/auth/callback/<provider>')
def social_auth_callback(provider):
    oauth_cfg = get_oauth_provider(provider)
    if not oauth_cfg:
        clear_oauth_session()
        return redirect(url_for('login_page', oauth_error='unknown_provider'))

    provider = oauth_cfg['key']
    callback_error = request.args.get('error')
    if callback_error:
        clear_oauth_session()
        return redirect(url_for('login_page', oauth_error='access_denied'))

    expected_provider = session.get('oauth_provider')
    expected_state = session.get('oauth_state')
    received_state = request.args.get('state', '')

    if expected_provider != provider:
        clear_oauth_session()
        return redirect(url_for('login_page', oauth_error='provider_mismatch'))

    if not expected_state or not received_state or not hmac.compare_digest(expected_state, received_state):
        clear_oauth_session()
        return redirect(url_for('login_page', oauth_error='invalid_state'))

    code = request.args.get('code', '')
    if not code:
        clear_oauth_session()
        return redirect(url_for('login_page', oauth_error='missing_code'))

    try:
        redirect_uri = url_for('social_auth_callback', provider=provider, _external=True)
        access_token = exchange_oauth_code_for_token(provider, oauth_cfg, code, redirect_uri)
        profile = fetch_oauth_profile(provider, access_token)
        user = find_or_create_social_user(provider, profile)
    except Exception as exc:
        print(f'[OAuth] {provider} callback failed: {exc}')
        clear_oauth_session()
        return redirect(url_for('login_page', oauth_error='oauth_failed'))

    clear_oauth_session()
    return issue_auth_cookie_redirect(user)

# ─────────────────────────────────────────────
# API — PORTFOLIO
# ─────────────────────────────────────────────
@app.route('/api/portfolio', methods=['GET'])
@login_required
def get_portfolio(current_user):
    with get_db() as db:
        p = db.execute("SELECT * FROM portfolios WHERE user_id=? ORDER BY created_at DESC LIMIT 1", (current_user['id'],)).fetchone()
        if not p: return jsonify({'error': 'No portfolio found'}), 404
        sections = db.execute("""SELECT * FROM portfolio_sections WHERE portfolio_id=? ORDER BY order_index""", (p['id'],)).fetchall()
    result = dict(p)
    result['sections'] = [{**dict(s), 'content': json.loads(s['content'])} for s in sections]
    return jsonify(result)

@app.route('/api/portfolio', methods=['PUT'])
@login_required
def update_portfolio(current_user):
    data = request.get_json(silent=True) or {}
    if not isinstance(data, dict):
        return jsonify({'error': 'Invalid JSON payload'}), 400

    with get_db() as db:
        p = db.execute("SELECT * FROM portfolios WHERE user_id=?", (current_user['id'],)).fetchone()
        if not p: return jsonify({'error': 'Portfolio not found'}), 404

        updates = {}
        if 'theme' in data: updates['theme'] = data['theme']
        if 'title' in data: updates['title'] = data['title']
        if 'is_published' in data: updates['is_published'] = 1 if data['is_published'] else 0

        if updates:
            set_clause = ', '.join(f'{k}=?' for k in updates)
            db.execute(f"UPDATE portfolios SET {set_clause}, updated_at=? WHERE id=?",
                       (*updates.values(), utcnow().isoformat(), p['id']))

        # Update sections
        if 'sections' in data:
            for i, sec in enumerate(data['sections']):
                sid = str(sec.get('id') or '').strip()
                section_type = str(sec.get('section_type') or '').strip().lower()
                if not section_type:
                    continue
                if section_type not in VALID_PORTFOLIO_SECTION_TYPES:
                    continue

                payload = json.dumps(sec.get('content', {}))
                is_visible = 1 if sec.get('is_visible', True) else 0

                if sid:
                    updated = db.execute(
                        """UPDATE portfolio_sections
                           SET content=?, is_visible=?, order_index=?, section_type=?
                           WHERE id=? AND portfolio_id=?""",
                        (payload, is_visible, i, section_type, sid, p['id'])
                    )
                    if updated.rowcount > 0:
                        continue

                existing = db.execute(
                    "SELECT id FROM portfolio_sections WHERE portfolio_id=? AND section_type=? LIMIT 1",
                    (p['id'], section_type)
                ).fetchone()

                if existing:
                    db.execute(
                        """UPDATE portfolio_sections
                           SET content=?, is_visible=?, order_index=?
                           WHERE id=? AND portfolio_id=?""",
                        (payload, is_visible, i, existing['id'], p['id'])
                    )
                else:
                    db.execute(
                        """INSERT INTO portfolio_sections(id,portfolio_id,section_type,content,is_visible,order_index)
                           VALUES(?,?,?,?,?,?)""",
                        (str(uuid.uuid4()), p['id'], section_type, payload, is_visible, i)
                    )
        db.commit()
    return jsonify({'success': True, 'message': 'Portfolio saved!'})

@app.route('/api/portfolio/publish', methods=['POST'])
@login_required
def publish_portfolio(current_user):
    with get_db() as db:
        p = db.execute("SELECT * FROM portfolios WHERE user_id=?", (current_user['id'],)).fetchone()
        if not p: return jsonify({'error': 'Portfolio not found'}), 404
        new_status = 0 if p['is_published'] else 1
        db.execute("UPDATE portfolios SET is_published=?, updated_at=? WHERE id=?",
                   (new_status, utcnow().isoformat(), p['id']))
        db.commit()
    action = 'published' if new_status else 'unpublished'
    return jsonify({'success': True, 'is_published': bool(new_status), 'message': f'Portfolio {action}!', 'url': f'/p/{p["slug"]}'})

@app.route('/api/portfolio/analytics')
@login_required
def portfolio_analytics(current_user):
    with get_db() as db:
        p = db.execute("SELECT * FROM portfolios WHERE user_id=?", (current_user['id'],)).fetchone()
        if not p: return jsonify({'error': 'No portfolio'}), 404

        # Last 7 days views
        seven_days = [(utcnow() - timedelta(days=i)).strftime('%Y-%m-%d') for i in range(6,-1,-1)]
        views_data = []
        for day in seven_days:
            count = db.execute("""SELECT COUNT(*) as c FROM analytics
                                  WHERE portfolio_id=? AND event_type='view' AND created_at LIKE ?""",
                               (p['id'], day+'%')).fetchone()['c']
            views_data.append({'date': day, 'views': count})

        contacts = db.execute("""SELECT id,sender_name,sender_email,subject,message,is_read,created_at
                                 FROM contacts WHERE portfolio_id=? ORDER BY created_at DESC LIMIT 10""",
                              (p['id'],)).fetchall()
        source_rows = db.execute(
            """SELECT
                    CASE
                        WHEN trim(COALESCE(utm_source,'')) != '' THEN lower(trim(utm_source))
                        WHEN trim(COALESCE(source_label,'')) != '' THEN lower(trim(source_label))
                        ELSE 'direct'
                    END AS source,
                    COUNT(*) AS views
               FROM analytics
               WHERE portfolio_id=? AND event_type='view'
               GROUP BY source
               ORDER BY views DESC, source ASC
               LIMIT 8""",
            (p['id'],)
        ).fetchall()
        campaign_rows = db.execute(
            """SELECT lower(trim(utm_campaign)) AS campaign, COUNT(*) AS views
               FROM analytics
               WHERE portfolio_id=? AND event_type='view' AND trim(COALESCE(utm_campaign,'')) != ''
               GROUP BY campaign
               ORDER BY views DESC, campaign ASC
               LIMIT 8""",
            (p['id'],)
        ).fetchall()
        total_views = db.execute("SELECT SUM(views) as t FROM portfolios WHERE user_id=?", (current_user['id'],)).fetchone()['t'] or 0
        total_contacts = db.execute("""SELECT COUNT(*) as c FROM contacts WHERE portfolio_id=?""", (p['id'],)).fetchone()['c']

    return jsonify({
        'total_views': total_views,
        'total_contacts': total_contacts,
        'views_chart': views_data,
        'top_sources': [dict(row) for row in source_rows],
        'top_campaigns': [dict(row) for row in campaign_rows],
        'portfolio_url': f'/p/{p["slug"]}',
        'is_published': bool(p['is_published']),
        'contacts': [dict(c) for c in contacts]
    })

# ─────────────────────────────────────────────
# API — CONTACT FORM
# ─────────────────────────────────────────────
@app.route('/api/contact/<slug>', methods=['POST'])
def submit_contact(slug):
    data = request.get_json(silent=True) or {}
    if not isinstance(data, dict):
        return jsonify({'error': 'Invalid JSON payload'}), 400

    client_ip = get_request_ip()
    slug_key = str(slug or '').strip().lower()
    if is_rate_limited(f'contact:ip:{slug_key}:{client_ip}', limit=6, window_seconds=600):
        return jsonify({'error': 'Too many messages sent recently. Please try again in a few minutes.'}), 429

    # Hidden honeypot field for basic bot filtering.
    if str(data.get('website', '') or '').strip():
        return jsonify({'success': True, 'auto_reply': 'Thanks! Your message has been received.'})

    name = (data.get('name','') or '').strip()
    email = (data.get('email','') or '').strip().lower()
    subject = (data.get('subject','') or '').strip()
    message = (data.get('message','') or '').strip()

    if not name or not email or not message:
        return jsonify({'error': 'Name, email and message are required'}), 400
    if not re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', email):
        return jsonify({'error': 'Please provide a valid email address'}), 400
    if len(name) > 120:
        return jsonify({'error': 'Name is too long'}), 400
    if len(subject) > 180:
        return jsonify({'error': 'Subject is too long'}), 400
    if len(message) < 10 or len(message) > 3000:
        return jsonify({'error': 'Message must be between 10 and 3000 characters'}), 400
    if is_rate_limited(f'contact:email:{slug_key}:{email}', limit=5, window_seconds=1800):
        return jsonify({'error': 'Too many messages from this email. Please try again later.'}), 429

    with get_db() as db:
        p = db.execute("SELECT * FROM portfolios WHERE slug=?", (slug,)).fetchone()
        if not p: return jsonify({'error': 'Portfolio not found'}), 404
        owner = db.execute("SELECT name FROM users WHERE id=?", (p['user_id'],)).fetchone()

        cid = str(uuid.uuid4())
        db.execute("""INSERT INTO contacts(id,portfolio_id,sender_name,sender_email,subject,message,created_at)
                      VALUES(?,?,?,?,?,?,?)""",
                   (cid, p['id'], name, email, subject, message, utcnow().isoformat()))
        db.commit()

    owner_name = owner['name'] if owner else 'the developer'
    auto_reply = f"Hi {name}! Thanks for reaching out to {owner_name}'s portfolio. Your message has been received and they'll get back to you within 24-48 hours. We appreciate your interest!"
    return jsonify({'success': True, 'auto_reply': auto_reply})

# ─────────────────────────────────────────────
# API — CHATBOT
# ─────────────────────────────────────────────
CHATBOT_KB = {
    'greet': {
        'patterns': ['hi', 'hello', 'hey', 'good morning', 'good evening', 'hola', 'namaste'],
        'responses': [
            "Hi there! I am QuickFolio AI. I can help with latest features, resume PDF modes, performance tuning, pricing, and publishing.",
            "Welcome to QuickFolio! Ask me anything about building, optimizing, or deploying your portfolio.",
            "Hey! I can guide you through builder setup, ATS-friendly resume export, Command Center shortcuts, and analytics."
        ],
        'suggestions': ['Show latest features', 'How do resume PDF modes work?', 'How do I publish quickly?']
    },
    'build': {
        'patterns': ['build', 'create', 'make', 'start', 'how to', 'get started', 'begin', 'setup'],
        'responses': [
            "Fast start flow:\n1. Create account\n2. Choose template/theme\n3. Edit sections (Hero, About, Skills, Projects, Experience, Contact)\n4. Publish or export\n\nTip: open Command Center with **Ctrl/Cmd + K** for quick actions.",
            "You can launch a strong portfolio in minutes: choose a template, refine your narrative, add proof projects, and publish. Want a step-by-step checklist for your role?"
        ],
        'suggestions': ['Give me a launch checklist', 'How to add strong projects?', 'How to optimize for recruiters?']
    },
    'resume': {
        'patterns': ['resume', 'cv', 'pdf', 'ats', 'layout', 'executive', 'compact', 'strict', 'photo', 'languages', 'volunteer', 'achievements'],
        'responses': [
            "Resume editor supports **Compact**, **Executive**, and **ATS-Strict** layouts. You can export polished PDFs, reorder sections, and keep the photo optional.",
            "For resume quality: use measurable bullets, keep sections concise, and pick layout mode based on your target role. ATS-Strict is best for scanner-heavy pipelines.",
            "Latest resume flow includes optional photo rendering, plus dedicated **Languages**, **Volunteer**, and **Achievements** sections."
        ],
        'suggestions': ['Which resume mode should I use?', 'How to make ATS-friendly bullets?', 'How to hide photo in PDF?']
    },
    'performance': {
        'patterns': ['speed', 'performance', 'fast', 'core web vitals', 'lcp', 'inp', 'cls', 'ttfb', 'fcp', 'perf', 'optimize', 'cache'],
        'responses': [
            "QuickFolio now tracks Core Web Vitals (LCP, INP, CLS, FCP, TTFB) and provides p75 health snapshots so you can optimize real user experience.",
            "For better speed: enable Performance Mode, keep media compressed, and review vitals in dashboard analytics.",
            "Performance stack includes smarter static caching, service worker updates, and faster asset delivery to reduce time-to-interaction."
        ],
        'suggestions': ['Show Core Web Vitals basics', 'How do I improve LCP?', 'Where can I see vitals in dashboard?']
    },
    'command': {
        'patterns': ['command center', 'command', 'shortcut', 'ctrl k', 'cmd k', 'quick action'],
        'responses': [
            "Open **Command Center** with **Ctrl/Cmd + K**. It gives fast actions like page jumps, chatbot toggle, performance snapshots, and workflow shortcuts.",
            "Command Center is your power-user launcher. Use it for quick navigation and productivity actions without hunting through menus."
        ],
        'suggestions': ['What can Command Center do?', 'Show useful shortcuts', 'How to open vitals snapshot?']
    },
    'themes': {
        'patterns': ['theme', 'design', 'color', 'style', 'look', 'aesthetic', 'font', 'typography'],
        'responses': [
            "Themes are fully responsive and can be switched instantly. You can further personalize colors, typography, spacing, and section emphasis.",
            "Pick a theme for first impression, then tune section hierarchy and contrast so recruiters scan your story quickly."
        ],
        'suggestions': ['How do I pick a theme?', 'How to improve readability?', 'Can I customize typography?']
    },
    'pricing': {
        'patterns': ['price', 'pricing', 'cost', 'free', 'plan', 'paid', 'subscription', 'billing', 'inr', 'rupee'],
        'responses': [
            "I can show the latest live plans and billing cycles from the current catalog.",
            "Plans are structured by growth stage. Ask me to compare Free, Pro, and Team quickly."
        ],
        'suggestions': ['Compare Free vs Pro', 'Show yearly savings', 'How to change plan?']
    },
    'deploy': {
        'patterns': ['deploy', 'publish', 'github', 'netlify', 'vercel', 'domain', 'host', 'live', 'url', 'export'],
        'responses': [
            "Deployment paths:\n1. Use in-app **Publish** for instant hosting\n2. Export HTML and deploy to GitHub Pages, Netlify, or Vercel\n3. Attach custom domain when ready",
            "If you want fastest launch, publish directly first. Then move to your own domain after content stabilizes."
        ],
        'suggestions': ['Give me GitHub Pages steps', 'How to use custom domain?', 'Publish vs export difference']
    },
    'features': {
        'patterns': ['feature', 'what can', 'capability', 'section', 'chatbot', 'contact', 'analytics', 'new', 'latest'],
        'responses': [
            "Latest QuickFolio highlights:\n• Resume PDF modes (Compact / Executive / ATS-Strict)\n• Optional resume photo + extra sections\n• Command Center + productivity actions\n• Performance Mode + Core Web Vitals telemetry\n• Smart publishing, analytics, and chatbot",
            "You get both polish and speed: rich builder controls, recruiter-friendly outputs, public analytics, and modern performance tooling."
        ],
        'suggestions': ['Show resume upgrades', 'Show performance upgrades', 'What is new in chatbot?']
    },
    'analytics': {
        'patterns': ['analytics', 'traffic', 'views', 'visitors', 'dashboard', 'metrics', 'campaign', 'source', 'web vitals'],
        'responses': [
            "Analytics now covers traffic trends, top sources/campaigns, contact activity, and Core Web Vitals summary.",
            "Use dashboard analytics to track what attracts recruiters and where performance may be hurting conversion."
        ],
        'suggestions': ['How to read dashboard metrics?', 'How to improve conversion?', 'How are sources tracked?']
    },
    'auth': {
        'patterns': ['login', 'signup', 'account', 'register', 'google', 'github login', 'social', 'signin', 'sign in'],
        'responses': [
            "Sign up with email/password or social providers (GitHub, Google, LinkedIn) when configured.",
            "If login fails, verify provider config first, then retry with a fresh session."
        ],
        'suggestions': ['How to create account?', 'Troubleshoot login issue', 'Which sign-in options are available?']
    },
    'help': {
        'patterns': ['help', 'support', 'problem', 'issue', 'bug', 'error', 'stuck', 'not working', 'fix'],
        'responses': [
            "Quick troubleshooting:\n• Hard refresh to clear stale assets\n• Re-open session and retry save/publish\n• Check network and auth status\n• Revisit docs/manual for feature-specific steps",
            "I can narrow this down fast. Tell me which page and action failed, and I will suggest targeted fixes. You can also email us directly at **Ks6911843@gmail.com**."
        ],
        'suggestions': ['Theme not updating', 'Chatbot not responding', 'Publish action failing']
    },
    'thanks': {
        'patterns': ['thanks', 'thank you', 'great', 'awesome', 'nice', 'cool'],
        'responses': [
            "Happy to help. Want me to suggest the next best improvement for your portfolio?",
            "Great. If you want, I can give a recruiter-focused improvement checklist next."
        ],
        'suggestions': ['Give me recruiter checklist', 'Show advanced tips', 'How to improve conversion?']
    },
    'default': [
        "I can help with **resume PDF modes**, **features**, **pricing**, **performance**, **deployment**, and **analytics**. What would you like to improve first?",
        "I did not fully catch that. Try asking about builder setup, ATS resume export, publishing, or dashboard insights.",
        "If you share your goal (jobs, freelance leads, or personal brand), I can give a tailored action plan."
    ]
}

CHATBOT_INTENT_PRIORITY = {
    'resume': 1,
    'features': 2,
    'build': 3,
    'deploy': 4,
    'pricing': 5,
    'analytics': 6,
    'performance': 7,
    'command': 8,
    'themes': 9,
    'help': 10,
    'auth': 11,
    'greet': 12,
    'thanks': 13,
}

CHATBOT_INTENT_STOPWORDS = {
    'the', 'a', 'an', 'is', 'are', 'and', 'or', 'to', 'in', 'on', 'for', 'of', 'about', 'me', 'my', 'it', 'this',
    'that', 'do', 'can', 'you', 'please', 'tell', 'with', 'how', 'what', 'when', 'where', 'why'
}

CHATBOT_FOLLOW_UP_TOKENS = {
    'more', 'details', 'detail', 'elaborate', 'continue', 'next', 'expand', 'example', 'examples'
}

CHATBOT_SESSION_STATE = {}
CHATBOT_SESSION_TTL_SECONDS = 5400


def tokenize_chatbot_message(message):
    tokens = re.findall(r'[a-z0-9+#.-]{2,}', str(message or '').lower())
    return [token for token in tokens if token and token not in CHATBOT_INTENT_STOPWORDS]


def score_chatbot_intent(message, tokens, patterns):
    msg = str(message or '').lower().strip()
    if not msg:
        return 0.0

    padded = f" {msg} "
    token_set = set(tokens)
    score = 0.0

    for pattern in (patterns or []):
        raw = str(pattern or '').lower().strip()
        if not raw:
            continue

        phrase_tokens = re.findall(r'[a-z0-9+#.-]{2,}', raw)
        if not phrase_tokens:
            continue

        phrase = ' '.join(phrase_tokens)
        if len(phrase_tokens) > 1:
            if phrase in msg:
                score += 4.2
                continue
            overlap = sum(1 for token in phrase_tokens if token in token_set)
            coverage = overlap / float(len(phrase_tokens))
            if coverage >= 0.66:
                score += 2.4 * coverage
            continue

        token = phrase_tokens[0]
        if token in token_set:
            score += 2.8
        elif f" {token} " in padded:
            score += 1.8
        elif any(existing.startswith(token) or token.startswith(existing) for existing in token_set):
            score += 1.1

    return round(score, 3)


def rank_chatbot_intents(message, tokens):
    ranked = []
    for intent, kb in CHATBOT_KB.items():
        if intent == 'default':
            continue
        score = score_chatbot_intent(message, tokens, kb.get('patterns'))
        if score > 0:
            ranked.append((intent, score))

    ranked.sort(key=lambda item: (-item[1], CHATBOT_INTENT_PRIORITY.get(item[0], 99), item[0]))
    return ranked


def get_chatbot_session_state(session_id):
    sid = str(session_id or '').strip()
    if not sid:
        sid = str(uuid.uuid4())

    now_ts = time.time()

    # Prune stale sessions opportunistically to keep memory bounded.
    stale = [
        key for key, value in CHATBOT_SESSION_STATE.items()
        if (now_ts - float(value.get('updated_at') or 0.0)) > CHATBOT_SESSION_TTL_SECONDS
    ]
    for key in stale[:300]:
        CHATBOT_SESSION_STATE.pop(key, None)

    state = CHATBOT_SESSION_STATE.get(sid)
    if not state:
        state = {'last_intent': '', 'turns': 0, 'updated_at': now_ts}
        CHATBOT_SESSION_STATE[sid] = state
    else:
        state['updated_at'] = now_ts

    return sid, state


def is_chatbot_follow_up(message, tokens):
    compact = str(message or '').strip().lower()
    token_set = set(tokens)
    if token_set.intersection(CHATBOT_FOLLOW_UP_TOKENS):
        return True
    return compact in {'more', 'tell me more', 'details', 'and then', 'what next', 'continue'}


def format_inr_amount(value):
    amount = int(value or 0)
    if amount <= 0:
        return 'Free'
    return f"₹{amount:,}"


def build_chatbot_pricing_response():
    plans = list_plan_catalog()
    lines = ["Current live plans:"]

    for plan in plans:
        name = str(plan.get('name') or 'Plan').strip()
        monthly = format_inr_amount(plan.get('monthly_inr'))
        yearly = format_inr_amount(plan.get('yearly_inr'))
        desc = str(plan.get('description') or '').strip()

        if monthly == 'Free' and yearly == 'Free':
            price_line = 'Free forever'
        else:
            price_line = f"{monthly}/month or {yearly}/year"

        lines.append(f"• **{name}** — {price_line}")
        if desc:
            lines.append(f"  {desc}")

    lines.append("\nYou can switch plans anytime from the **Billing** page.")
    return '\n'.join(lines)


def extract_portfolio_skill_names(skills_payload, max_items=10):
    names = []
    seen = set()
    categories = skills_payload.get('categories') if isinstance(skills_payload.get('categories'), list) else []

    for category in categories:
        items = category.get('items') if isinstance(category.get('items'), list) else []
        for item in items:
            label = str(item.get('n') or item.get('name') or '').strip()
            if not label:
                continue
            key = label.lower()
            if key in seen:
                continue
            seen.add(key)
            names.append(label)
            if len(names) >= max_items:
                return names
    return names


def extract_portfolio_project_titles(projects_payload, max_items=8):
    titles = []
    seen = set()
    items = projects_payload.get('items') if isinstance(projects_payload.get('items'), list) else []

    for item in items:
        title = str(item.get('title') or item.get('name') or '').strip()
        if not title:
            continue
        key = title.lower()
        if key in seen:
            continue
        seen.add(key)
        titles.append(title)
        if len(titles) >= max_items:
            break
    return titles


def build_portfolio_chat_context(portfolio_id):
    pid = str(portfolio_id or '').strip()
    if not pid:
        return {}

    try:
        with get_db() as db:
            portfolio = db.execute(
                "SELECT id,user_id,title,slug,custom_domain FROM portfolios WHERE id=? LIMIT 1",
                (pid,)
            ).fetchone()
            if not portfolio:
                return {}

            owner = db.execute(
                "SELECT name,email FROM users WHERE id=? LIMIT 1",
                (portfolio['user_id'],)
            ).fetchone()

            rows = db.execute(
                """SELECT section_type,content
                   FROM portfolio_sections
                   WHERE portfolio_id=? AND is_visible=1
                   ORDER BY order_index""",
                (pid,)
            ).fetchall()
    except Exception:
        return {}

    section_map = {}
    for row in rows:
        section_type = str(row['section_type'] or '').strip().lower()
        if section_type:
            section_map[section_type] = parse_section_content(row['content'])

    hero = section_map.get('hero', {})
    about = section_map.get('about', {})
    contact = section_map.get('contact', {})
    skills = section_map.get('skills', {})
    projects = section_map.get('projects', {})

    return {
        'owner_name': str((owner['name'] if owner else '') or hero.get('name') or '').strip(),
        'owner_email': str((owner['email'] if owner else '') or '').strip(),
        'title': str(portfolio['title'] or '').strip(),
        'slug': str(portfolio['slug'] or '').strip(),
        'custom_domain': str(portfolio['custom_domain'] or '').strip(),
        'hero_tagline': str(hero.get('tagline') or hero.get('title') or '').strip(),
        'about_summary': str(about.get('bio') or '').strip(),
        'availability': str(about.get('availability') or '').strip(),
        'contact_email': str(contact.get('email') or '').strip(),
        'contact_phone': str(contact.get('phone') or '').strip(),
        'skills': extract_portfolio_skill_names(skills),
        'project_titles': extract_portfolio_project_titles(projects),
    }


def build_portfolio_context_reply(message, tokens, context):
    if not context:
        return None

    token_set = set(tokens)
    owner_name = context.get('owner_name') or 'this developer'

    project_terms = {'project', 'projects', 'work', 'case', 'portfolio'}
    skill_terms = {'skill', 'skills', 'stack', 'tech', 'technology', 'tools'}
    contact_terms = {'contact', 'hire', 'hiring', 'email', 'phone', 'reach', 'availability', 'available'}
    about_terms = {'about', 'background', 'intro', 'summary', 'who'}

    if token_set.intersection(project_terms):
        project_titles = context.get('project_titles') or []
        if project_titles:
            sample = ', '.join(f"**{title}**" for title in project_titles[:3])
            suffix = ' There are more projects listed as well.' if len(project_titles) > 3 else ''
            return f"Top projects from this portfolio include {sample}.{suffix}"
        return "Projects are not listed yet on this portfolio, but you can ask for skills or contact details."

    if token_set.intersection(skill_terms):
        skills = context.get('skills') or []
        if skills:
            sample = ', '.join(f"**{name}**" for name in skills[:8])
            return f"Key skills highlighted here: {sample}."
        return "The skills section is currently light. Ask about projects or contact details instead."

    if token_set.intersection(contact_terms):
        channels = []
        email = context.get('contact_email') or context.get('owner_email')
        phone = context.get('contact_phone')
        availability = context.get('availability')

        if email:
            channels.append(f"email at **{email}**")
        if phone:
            channels.append(f"phone at **{phone}**")
        if availability:
            channels.append(f"availability: **{availability}**")

        if channels:
            return f"You can reach {owner_name} via " + ', '.join(channels) + '.'
        return f"Use the contact form on this portfolio page to reach {owner_name}."

    if token_set.intersection(about_terms) or 'who is' in message:
        summary = context.get('about_summary') or context.get('hero_tagline')
        if summary:
            return f"About {owner_name}: {summary}"

    return None


def select_chatbot_reply(intent):
    import random

    if intent == 'pricing':
        return build_chatbot_pricing_response()

    responses = (CHATBOT_KB.get(intent) or {}).get('responses')
    if isinstance(responses, list) and responses:
        return random.choice(responses)

    return random.choice(CHATBOT_KB['default'])


def get_chatbot_suggestions(intent, has_portfolio_context=False):
    if intent == 'portfolio_context':
        items = ['Show top projects', 'What is the tech stack?', 'How can I contact the owner?']
    else:
        items = list((CHATBOT_KB.get(intent) or {}).get('suggestions') or [])

    if not items:
        items = ['Show latest features', 'How do resume PDF modes work?', 'How do I publish quickly?']

    if has_portfolio_context:
        for extra in ['Show top projects', 'What skills stand out?']:
            if extra not in items:
                items.append(extra)

    return items[:4]

@app.route('/api/chatbot', methods=['POST'])
def chatbot():
    data = request.get_json(silent=True) or {}
    raw_msg = str(data.get('message', '') or '').strip()
    session_id = data.get('session_id', str(uuid.uuid4()))
    portfolio_id = str(data.get('portfolio_id', '') or '').strip()

    if not raw_msg:
        return jsonify({'error': 'Message required'}), 400

    msg = raw_msg.lower()
    tokens = tokenize_chatbot_message(msg)
    session_id, session_state = get_chatbot_session_state(session_id)
    portfolio_context = build_portfolio_chat_context(portfolio_id)

    intent = 'default'
    confidence = 0.0

    # Portfolio page chats get data-aware answers for projects/skills/contact.
    reply = build_portfolio_context_reply(msg, tokens, portfolio_context)
    if reply:
        intent = 'portfolio_context'
        confidence = 0.96
    else:
        ranked = rank_chatbot_intents(msg, tokens)
        if ranked and ranked[0][1] >= 1.35:
            intent, confidence = ranked[0]
        elif is_chatbot_follow_up(msg, tokens) and session_state.get('last_intent'):
            intent = str(session_state.get('last_intent') or 'default')
            confidence = 0.82
        reply = select_chatbot_reply(intent)

    if intent not in {'default', 'portfolio_context'}:
        session_state['last_intent'] = intent
    session_state['turns'] = int(session_state.get('turns') or 0) + 1
    session_state['updated_at'] = time.time()

    suggestions = get_chatbot_suggestions(intent, has_portfolio_context=bool(portfolio_context))

    # Log conversation
    try:
        with get_db() as db:
            db.execute("""INSERT INTO chatbot_logs(id,portfolio_id,session_id,user_message,bot_reply,created_at)
                          VALUES(?,?,?,?,?,?)""",
                       (str(uuid.uuid4()), portfolio_id, session_id, raw_msg, reply, utcnow().isoformat()))
            db.commit()
    except Exception:
        pass

    return jsonify({
        'reply': reply,
        'session_id': session_id,
        'intent': intent,
        'confidence': round(float(confidence), 3),
        'suggestions': suggestions,
    })


@app.route('/api/plans')
def get_plans_catalog():
    return jsonify({'plans': list_plan_catalog(), 'default_cycle': 'monthly'})


@app.route('/api/billing/summary')
@login_required
def billing_summary(current_user):
    with get_db() as db:
        snapshot = fetch_billing_snapshot(db, current_user['id'], current_user['plan'])
        plan_id = snapshot['subscription']['plan_id']
        if normalize_plan_id(current_user['plan']) != plan_id:
            db.execute("UPDATE users SET plan=? WHERE id=?", (plan_id, current_user['id']))
            db.commit()
    return jsonify(snapshot)


@app.route('/api/billing/checkout', methods=['POST'])
@login_required
def billing_checkout(current_user):
    payload = request.get_json(silent=True) or {}
    plan_id = normalize_plan_id(payload.get('plan_id'))
    billing_cycle = normalize_billing_cycle(payload.get('billing_cycle'))
    if plan_id == 'free':
        billing_cycle = 'monthly'

    now_dt = utcnow()
    now_iso = now_dt.isoformat()

    with get_db() as db:
        subscription_row, _created = ensure_user_subscription(db, current_user['id'], current_user['plan'])
        period_end = ''
        if plan_id != 'free':
            period_end = (now_dt + timedelta(days=BILLING_CYCLE_DAYS[billing_cycle])).isoformat()

        db.execute(
            """UPDATE subscriptions
               SET plan_id=?, billing_cycle=?, status='active', current_period_start=?,
                   current_period_end=?, cancel_at_period_end=0, updated_at=?
               WHERE id=?""",
            (plan_id, billing_cycle, now_iso, period_end, now_iso, subscription_row['id'])
        )
        db.execute("UPDATE users SET plan=? WHERE id=?", (plan_id, current_user['id']))

        amount_inr = get_plan_price_inr(plan_id, billing_cycle)
        invoice_status = 'paid' if amount_inr > 0 else 'adjustment'
        invoice_description = (
            f"{serialize_plan(plan_id)['name']} membership ({billing_cycle})"
            if amount_inr > 0 else
            'Downgrade adjustment to Free plan'
        )
        invoice_row = create_billing_invoice(
            db,
            current_user['id'],
            plan_id,
            billing_cycle,
            amount_inr,
            status=invoice_status,
            description=invoice_description,
        )

        if plan_id != 'free':
            upsert_payment_method(db, current_user['id'], payload.get('payment_method'))

        db.commit()
        snapshot = fetch_billing_snapshot(db, current_user['id'], plan_id)

    message = 'Moved to Free plan.' if plan_id == 'free' else f"{serialize_plan(plan_id)['name']} plan activated."
    return jsonify({
        'success': True,
        'message': message,
        'invoice': serialize_invoice(invoice_row),
        **snapshot,
    })


@app.route('/api/billing/cancel', methods=['POST'])
@login_required
def billing_cancel(current_user):
    with get_db() as db:
        subscription_row, _created = ensure_user_subscription(db, current_user['id'], current_user['plan'])
        if normalize_plan_id(subscription_row['plan_id']) == 'free':
            return jsonify({'error': 'Free plan does not require cancellation'}), 400

        db.execute(
            "UPDATE subscriptions SET cancel_at_period_end=1, updated_at=? WHERE id=?",
            (utcnow().isoformat(), subscription_row['id'])
        )
        db.commit()
        snapshot = fetch_billing_snapshot(db, current_user['id'], subscription_row['plan_id'])

    return jsonify({
        'success': True,
        'message': 'Auto-renew disabled. Your membership remains active until period end.',
        **snapshot,
    })


@app.route('/api/billing/resume', methods=['POST'])
@login_required
def billing_resume(current_user):
    with get_db() as db:
        subscription_row, _created = ensure_user_subscription(db, current_user['id'], current_user['plan'])
        if normalize_plan_id(subscription_row['plan_id']) == 'free':
            return jsonify({'error': 'Upgrade first to enable auto-renew'}), 400

        db.execute(
            "UPDATE subscriptions SET cancel_at_period_end=0, updated_at=? WHERE id=?",
            (utcnow().isoformat(), subscription_row['id'])
        )
        db.commit()
        snapshot = fetch_billing_snapshot(db, current_user['id'], subscription_row['plan_id'])

    return jsonify({
        'success': True,
        'message': 'Auto-renew resumed for your membership.',
        **snapshot,
    })


@app.route('/api/billing/payment-method', methods=['PUT'])
@login_required
def billing_payment_method(current_user):
    payload = request.get_json(silent=True) or {}
    with get_db() as db:
        method_row = upsert_payment_method(db, current_user['id'], payload)
        db.commit()
    return jsonify({'success': True, 'payment_method': serialize_payment_method(method_row)})

# ─────────────────────────────────────────────
# API — TEMPLATES & MISC
# ─────────────────────────────────────────────
@app.route('/api/templates')
def get_templates():
    viewer = get_current_user()

    if not viewer:
        cached_payload = get_public_cache_entry('templates_public')
        if cached_payload is not None:
            response = jsonify(cached_payload)
            response.headers['Cache-Control'] = 'public, max-age=60, stale-while-revalidate=120'
            response.headers['X-Cache'] = 'HIT'
            return response

    with get_db() as db:
        if viewer:
            rows = db.execute(
                """SELECT t.*, COALESCE(u.name, '') AS creator_name
                   FROM templates t
                   LEFT JOIN users u ON u.id=t.created_by_user_id
                   WHERE (t.is_public=1 AND lower(COALESCE(t.approval_status, 'approved'))='approved')
                      OR t.created_by_user_id=?
                   ORDER BY t.is_featured DESC, t.uses DESC,
                            COALESCE(t.updated_at, t.created_at) DESC,
                            lower(t.name) ASC""",
                (viewer['id'],)
            ).fetchall()
        else:
            rows = db.execute(
                """SELECT t.*, COALESCE(u.name, '') AS creator_name
                   FROM templates t
                   LEFT JOIN users u ON u.id=t.created_by_user_id
                   WHERE t.is_public=1 AND lower(COALESCE(t.approval_status, 'approved'))='approved'
                   ORDER BY t.is_featured DESC, t.uses DESC,
                            COALESCE(t.updated_at, t.created_at) DESC,
                            lower(t.name) ASC"""
            ).fetchall()

    payload = [serialize_template_row(row, viewer, include_sections=False) for row in rows]
    response = jsonify(payload)

    if viewer:
        response.headers['Cache-Control'] = 'no-store'
        response.headers['X-Cache'] = 'BYPASS'
    else:
        set_public_cache_entry('templates_public', payload)
        response.headers['Cache-Control'] = 'public, max-age=60, stale-while-revalidate=120'
        response.headers['X-Cache'] = 'MISS'

    return response


@app.route('/api/templates/mine')
@login_required
def get_my_templates(current_user):
    with get_db() as db:
        rows = db.execute(
            """SELECT t.*, COALESCE(u.name, '') AS creator_name
               FROM templates t
               LEFT JOIN users u ON u.id=t.created_by_user_id
               WHERE t.created_by_user_id=?
               ORDER BY COALESCE(t.updated_at, t.created_at) DESC, lower(t.name) ASC""",
            (current_user['id'],)
        ).fetchall()
    return jsonify({'templates': [serialize_template_row(row, current_user) for row in rows]})


@app.route('/api/templates/<template_id>')
def get_template_details(template_id):
    tid = str(template_id or '').strip()
    if not tid:
        return jsonify({'error': 'Template id is required'}), 400

    viewer = get_current_user()
    mode = str(request.args.get('mode') or '').strip().lower()

    with get_db() as db:
        row = db.execute(
            """SELECT t.*, COALESCE(u.name, '') AS creator_name
               FROM templates t
               LEFT JOIN users u ON u.id=t.created_by_user_id
               WHERE t.id=?""",
            (tid,)
        ).fetchone()

        if not row:
            return jsonify({'error': 'Template not found'}), 404
        if not can_access_template_row(row, viewer):
            return jsonify({'error': 'Template not found'}), 404

        if mode == 'apply':
            db.execute(
                "UPDATE templates SET uses=COALESCE(uses, 0)+1, updated_at=? WHERE id=?",
                (utcnow().isoformat(), tid)
            )
            db.commit()
            row = db.execute(
                """SELECT t.*, COALESCE(u.name, '') AS creator_name
                   FROM templates t
                   LEFT JOIN users u ON u.id=t.created_by_user_id
                   WHERE t.id=?""",
                (tid,)
            ).fetchone()

    return jsonify({'template': serialize_template_row(row, viewer, include_sections=True)})


@app.route('/api/templates/custom', methods=['POST'])
@login_required
def create_custom_template(current_user):
    payload = request.get_json(silent=True) or {}
    name = str(payload.get('name') or '').strip()
    description = str(payload.get('description') or '').strip()
    category = normalize_template_category(payload.get('category'))
    share_public = parse_bool(payload.get('share_public'))

    if not name:
        return jsonify({'error': 'Template name is required'}), 400
    if len(name) > MAX_TEMPLATE_NAME_LENGTH:
        return jsonify({'error': f'Template name must be {MAX_TEMPLATE_NAME_LENGTH} characters or less'}), 400
    if len(description) > MAX_TEMPLATE_DESCRIPTION_LENGTH:
        return jsonify({'error': f'Description must be {MAX_TEMPLATE_DESCRIPTION_LENGTH} characters or less'}), 400

    with get_db() as db:
        portfolio, snapshot = build_template_snapshot_from_portfolio(db, current_user['id'])
        if not portfolio or not snapshot:
            return jsonify({'error': 'No portfolio found to build template from'}), 404

        try:
            snapshot_json = json.dumps(snapshot)
        except Exception:
            return jsonify({'error': 'Failed to serialize template snapshot'}), 500

        if len(snapshot_json.encode('utf-8')) > MAX_TEMPLATE_SNAPSHOT_BYTES:
            return jsonify({'error': 'Template snapshot is too large'}), 413

        now = utcnow().isoformat()
        template_id = str(uuid.uuid4())
        approval_status = 'pending' if share_public and not is_admin_user(current_user) else ('approved' if share_public else 'private')
        is_public = 1 if share_public else 0
        demo_url = (
            f"/p/{portfolio['slug']}"
            if bool(portfolio['is_published'])
            else f"/demo/{str(portfolio['theme'] or 'cyberpunk').strip().lower()}"
        )

        db.execute(
            """INSERT INTO templates(
                   id,name,description,theme,category,preview_image,sections_config,is_featured,uses,
                   created_by_user_id,is_public,approval_status,moderation_note,demo_url,created_at,updated_at
               ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                template_id,
                name,
                description,
                str(portfolio['theme'] or 'cyberpunk'),
                category,
                '',
                snapshot_json,
                0,
                0,
                current_user['id'],
                is_public,
                approval_status,
                '' if approval_status != 'pending' else 'Awaiting admin review',
                demo_url,
                now,
                now,
            )
        )
        db.commit()

        row = db.execute(
            """SELECT t.*, COALESCE(u.name, '') AS creator_name
               FROM templates t
               LEFT JOIN users u ON u.id=t.created_by_user_id
               WHERE t.id=?""",
            (template_id,)
        ).fetchone()

    return jsonify({
        'success': True,
        'message': 'Template submitted for review.' if approval_status == 'pending' else 'Template saved successfully.',
        'template': serialize_template_row(row, current_user, include_sections=False),
    })


@app.route('/api/templates/mine/<template_id>/submit', methods=['POST'])
@login_required
def submit_template_to_marketplace(current_user, template_id):
    tid = str(template_id or '').strip()
    if not tid:
        return jsonify({'error': 'Template id is required'}), 400

    with get_db() as db:
        row = db.execute("SELECT * FROM templates WHERE id=? AND created_by_user_id=?", (tid, current_user['id'])).fetchone()
        if not row:
            return jsonify({'error': 'Template not found'}), 404

        now = utcnow().isoformat()
        next_status = 'approved' if is_admin_user(current_user) else 'pending'
        db.execute(
            """UPDATE templates
               SET is_public=1, approval_status=?, moderation_note=?, updated_at=?
               WHERE id=?""",
            (next_status, '' if next_status == 'approved' else 'Awaiting admin review', now, tid)
        )
        db.commit()

    return jsonify({
        'success': True,
        'message': 'Template published to marketplace.' if next_status == 'approved' else 'Template sent for admin review.',
    })


@app.route('/api/templates/mine/<template_id>', methods=['DELETE'])
@login_required
def delete_my_template(current_user, template_id):
    tid = str(template_id or '').strip()
    if not tid:
        return jsonify({'error': 'Template id is required'}), 400

    with get_db() as db:
        row = db.execute("SELECT * FROM templates WHERE id=?", (tid,)).fetchone()
        if not row:
            return jsonify({'error': 'Template not found'}), 404

        owner_id = str(row['created_by_user_id'] or '')
        if owner_id != str(current_user['id']) and not is_admin_user(current_user):
            return jsonify({'error': 'Forbidden'}), 403

        db.execute("DELETE FROM templates WHERE id=?", (tid,))
        db.commit()

    return jsonify({'success': True})


@app.route('/api/admin/overview')
@admin_required
def admin_overview(current_user):
    with get_db() as db:
        total_users = db.execute("SELECT COUNT(*) AS c FROM users").fetchone()['c']
        active_users = db.execute("SELECT COUNT(*) AS c FROM users WHERE is_active=1").fetchone()['c']
        admin_users = db.execute("SELECT COUNT(*) AS c FROM users WHERE is_admin=1").fetchone()['c']
        total_templates = db.execute("SELECT COUNT(*) AS c FROM templates").fetchone()['c']
        pending_templates = db.execute("SELECT COUNT(*) AS c FROM templates WHERE lower(COALESCE(approval_status,''))='pending'").fetchone()['c']
        published_portfolios = db.execute("SELECT COUNT(*) AS c FROM portfolios WHERE is_published=1").fetchone()['c']
        total_views = db.execute("SELECT COALESCE(SUM(views), 0) AS t FROM portfolios").fetchone()['t']

        pending_rows = db.execute(
            """SELECT t.*, COALESCE(u.name, '') AS creator_name
               FROM templates t
               LEFT JOIN users u ON u.id=t.created_by_user_id
               WHERE lower(COALESCE(t.approval_status,''))='pending'
               ORDER BY COALESCE(t.updated_at, t.created_at) DESC
               LIMIT 40"""
        ).fetchall()

        user_rows = db.execute(
            """SELECT id,name,email,username,plan,is_active,is_admin,created_at,last_login
               FROM users
               ORDER BY created_at DESC
               LIMIT 120"""
        ).fetchall()

    return jsonify({
        'stats': {
            'total_users': total_users,
            'active_users': active_users,
            'admin_users': admin_users,
            'total_templates': total_templates,
            'pending_templates': pending_templates,
            'published_portfolios': published_portfolios,
            'total_views': total_views,
        },
        'pending_templates': [serialize_template_row(row, current_user) for row in pending_rows],
        'users': [dict(row) for row in user_rows],
    })


@app.route('/api/admin/templates')
@admin_required
def admin_templates(current_user):
    status_filter = str(request.args.get('status') or 'all').strip().lower()

    where_clause = ''
    params = []
    if status_filter in {'pending', 'approved', 'rejected', 'private'}:
        where_clause = "WHERE lower(COALESCE(t.approval_status,''))=?"
        params.append(status_filter)

    with get_db() as db:
        rows = db.execute(
            f"""SELECT t.*, COALESCE(u.name, '') AS creator_name
                FROM templates t
                LEFT JOIN users u ON u.id=t.created_by_user_id
                {where_clause}
                ORDER BY COALESCE(t.updated_at, t.created_at) DESC
                LIMIT 250""",
            tuple(params)
        ).fetchall()

    return jsonify({'templates': [serialize_template_row(row, current_user) for row in rows]})


@app.route('/api/admin/templates/<template_id>/approve', methods=['POST'])
@admin_required
def admin_approve_template(current_user, template_id):
    tid = str(template_id or '').strip()
    if not tid:
        return jsonify({'error': 'Template id is required'}), 400

    with get_db() as db:
        row = db.execute("SELECT id FROM templates WHERE id=?", (tid,)).fetchone()
        if not row:
            return jsonify({'error': 'Template not found'}), 404
        db.execute(
            """UPDATE templates
               SET is_public=1, approval_status='approved', moderation_note='', updated_at=?
               WHERE id=?""",
            (utcnow().isoformat(), tid)
        )
        db.commit()

    return jsonify({'success': True, 'message': 'Template approved and published.'})


@app.route('/api/admin/templates/<template_id>/reject', methods=['POST'])
@admin_required
def admin_reject_template(current_user, template_id):
    tid = str(template_id or '').strip()
    payload = request.get_json(silent=True) or {}
    moderation_note = str(payload.get('moderation_note') or 'Rejected by admin policy review').strip()[:220]

    if not tid:
        return jsonify({'error': 'Template id is required'}), 400

    with get_db() as db:
        row = db.execute("SELECT id FROM templates WHERE id=?", (tid,)).fetchone()
        if not row:
            return jsonify({'error': 'Template not found'}), 404
        db.execute(
            """UPDATE templates
               SET is_public=0, approval_status='rejected', moderation_note=?, updated_at=?
               WHERE id=?""",
            (moderation_note, utcnow().isoformat(), tid)
        )
        db.commit()

    return jsonify({'success': True, 'message': 'Template rejected.'})


@app.route('/api/admin/templates/<template_id>', methods=['DELETE'])
@admin_required
def admin_delete_template(current_user, template_id):
    tid = str(template_id or '').strip()
    if not tid:
        return jsonify({'error': 'Template id is required'}), 400

    with get_db() as db:
        row = db.execute("SELECT id FROM templates WHERE id=?", (tid,)).fetchone()
        if not row:
            return jsonify({'error': 'Template not found'}), 404
        db.execute("DELETE FROM templates WHERE id=?", (tid,))
        db.commit()

    return jsonify({'success': True, 'message': 'Template removed.'})


@app.route('/api/admin/users')
@admin_required
def admin_users(current_user):
    with get_db() as db:
        rows = db.execute(
            """SELECT id,name,email,username,plan,is_active,is_admin,created_at,last_login
               FROM users
               ORDER BY created_at DESC
               LIMIT 250"""
        ).fetchall()
    return jsonify({'users': [dict(row) for row in rows]})


@app.route('/api/admin/users/<user_id>/deactivate', methods=['POST'])
@admin_required
def admin_deactivate_user(current_user, user_id):
    uid = str(user_id or '').strip()
    if not uid:
        return jsonify({'error': 'User id is required'}), 400
    if uid == str(current_user['id']):
        return jsonify({'error': 'You cannot deactivate your own account'}), 400

    with get_db() as db:
        target = db.execute("SELECT id,is_admin FROM users WHERE id=?", (uid,)).fetchone()
        if not target:
            return jsonify({'error': 'User not found'}), 404

        if bool(target['is_admin']):
            active_admins = db.execute(
                "SELECT COUNT(*) AS c FROM users WHERE is_admin=1 AND is_active=1 AND id!=?",
                (uid,)
            ).fetchone()['c']
            if active_admins < 1:
                return jsonify({'error': 'At least one active admin account must remain'}), 400

        db.execute("UPDATE users SET is_active=0 WHERE id=?", (uid,))
        db.commit()
    return jsonify({'success': True, 'message': 'User deactivated.'})


@app.route('/api/admin/users/<user_id>/reactivate', methods=['POST'])
@admin_required
def admin_reactivate_user(current_user, user_id):
    uid = str(user_id or '').strip()
    if not uid:
        return jsonify({'error': 'User id is required'}), 400

    with get_db() as db:
        user = db.execute("SELECT id FROM users WHERE id=?", (uid,)).fetchone()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        db.execute("UPDATE users SET is_active=1 WHERE id=?", (uid,))
        db.commit()
    return jsonify({'success': True, 'message': 'User reactivated.'})


@app.route('/api/admin/users/<user_id>', methods=['DELETE'])
@admin_required
def admin_delete_user(current_user, user_id):
    uid = str(user_id or '').strip()
    if not uid:
        return jsonify({'error': 'User id is required'}), 400
    if uid == str(current_user['id']):
        return jsonify({'error': 'You cannot delete your own account'}), 400

    with get_db() as db:
        target = db.execute("SELECT id,is_admin FROM users WHERE id=?", (uid,)).fetchone()
        if not target:
            return jsonify({'error': 'User not found'}), 404

        if bool(target['is_admin']):
            other_admins = db.execute(
                "SELECT COUNT(*) AS c FROM users WHERE is_admin=1 AND id!=?",
                (uid,)
            ).fetchone()['c']
            if other_admins < 1:
                return jsonify({'error': 'At least one admin account must remain'}), 400

        delete_user_account_and_related(db, uid)
        db.commit()

    return jsonify({'success': True, 'message': 'User account and related data removed.'})

@app.route('/api/stats')
def public_stats():
    cached_payload = get_public_cache_entry('stats_public')
    if cached_payload is not None:
        response = jsonify(cached_payload)
        response.headers['Cache-Control'] = 'public, max-age=45, stale-while-revalidate=90'
        response.headers['X-Cache'] = 'HIT'
        return response

    with get_db() as db:
        users = db.execute("SELECT COUNT(*) as c FROM users").fetchone()['c']
        portfolios = db.execute("SELECT COUNT(*) as c FROM portfolios WHERE is_published=1").fetchone()['c']
        views = db.execute("SELECT COALESCE(SUM(views),0) as t FROM portfolios").fetchone()['t']
    payload = {'users': users, 'portfolios': portfolios, 'total_views': views}
    set_public_cache_entry('stats_public', payload)
    response = jsonify(payload)
    response.headers['Cache-Control'] = 'public, max-age=45, stale-while-revalidate=90'
    response.headers['X-Cache'] = 'MISS'
    return response


@app.route('/api/perf/vitals', methods=['POST'])
def ingest_web_vitals():
    payload = request.get_json(silent=True) or {}

    referrer = str(request.headers.get('Referer') or '').strip()
    fallback_path = '/'
    if referrer:
        try:
            fallback_path = urlparse(referrer).path or '/'
        except Exception:
            fallback_path = '/'

    page_path = str(payload.get('page_path') or fallback_path or '/').strip()[:180] or '/'
    page_type = str(payload.get('page_type') or 'web').strip().lower()[:40] or 'web'

    lcp_ms = parse_metric_float(payload.get('lcp_ms'), min_value=0.0, max_value=120000.0, decimals=2)
    inp_ms = parse_metric_float(payload.get('inp_ms'), min_value=0.0, max_value=120000.0, decimals=2)
    cls = parse_metric_float(payload.get('cls'), min_value=0.0, max_value=10.0, decimals=4)
    fcp_ms = parse_metric_float(payload.get('fcp_ms'), min_value=0.0, max_value=120000.0, decimals=2)
    ttfb_ms = parse_metric_float(payload.get('ttfb_ms'), min_value=0.0, max_value=120000.0, decimals=2)

    if all(metric is None for metric in [lcp_ms, inp_ms, cls, fcp_ms, ttfb_ms]):
        return jsonify({'error': 'No valid performance metrics provided'}), 400

    network_type = str(payload.get('network_type') or '').strip().lower()[:24]
    device_memory = parse_metric_float(payload.get('device_memory'), min_value=0.0, max_value=256.0, decimals=2)
    viewport = str(payload.get('viewport') or '').strip()[:32]

    user = get_current_user()
    user_id = str(user['id']) if user else ''

    with get_db() as db:
        db.execute(
            """INSERT INTO performance_metrics(
                   id,user_id,page_path,page_type,lcp_ms,inp_ms,cls,fcp_ms,ttfb_ms,network_type,device_memory,viewport,created_at
               ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                str(uuid.uuid4()),
                user_id,
                page_path,
                page_type,
                lcp_ms,
                inp_ms,
                cls,
                fcp_ms,
                ttfb_ms,
                network_type,
                device_memory,
                viewport,
                utcnow().isoformat(),
            ),
        )
        db.execute(
            "DELETE FROM performance_metrics WHERE created_at<?",
            ((utcnow() - timedelta(days=45)).isoformat(),),
        )
        db.commit()

    response = jsonify({'success': True})
    response.headers['Cache-Control'] = 'no-store'
    return response


@app.route('/api/perf/summary')
@login_required
def web_vitals_summary(current_user):
    since = (utcnow() - timedelta(days=14)).isoformat()
    with get_db() as db:
        rows = db.execute(
            """SELECT page_type,lcp_ms,inp_ms,cls,fcp_ms,ttfb_ms
               FROM performance_metrics
               WHERE created_at>=?
               ORDER BY created_at DESC
               LIMIT 1500""",
            (since,)
        ).fetchall()

    row_dicts = [dict(row) for row in rows]

    def metric_values(metric_key):
        return [float(item[metric_key]) for item in row_dicts if item.get(metric_key) is not None]

    p75 = {
        'lcp_ms': round(percentile_value(metric_values('lcp_ms'), 0.75), 2) if metric_values('lcp_ms') else None,
        'inp_ms': round(percentile_value(metric_values('inp_ms'), 0.75), 2) if metric_values('inp_ms') else None,
        'cls': round(percentile_value(metric_values('cls'), 0.75), 4) if metric_values('cls') else None,
        'fcp_ms': round(percentile_value(metric_values('fcp_ms'), 0.75), 2) if metric_values('fcp_ms') else None,
        'ttfb_ms': round(percentile_value(metric_values('ttfb_ms'), 0.75), 2) if metric_values('ttfb_ms') else None,
    }

    by_page_type = {}
    for item in row_dicts:
        key = str(item.get('page_type') or 'web').strip() or 'web'
        bucket = by_page_type.setdefault(key, {'sample_size': 0, 'lcp_ms': [], 'inp_ms': [], 'cls': []})
        bucket['sample_size'] += 1
        if item.get('lcp_ms') is not None:
            bucket['lcp_ms'].append(float(item['lcp_ms']))
        if item.get('inp_ms') is not None:
            bucket['inp_ms'].append(float(item['inp_ms']))
        if item.get('cls') is not None:
            bucket['cls'].append(float(item['cls']))

    normalized_page_types = {}
    for key, bucket in by_page_type.items():
        lcp_p75 = round(percentile_value(bucket['lcp_ms'], 0.75), 2) if bucket['lcp_ms'] else None
        inp_p75 = round(percentile_value(bucket['inp_ms'], 0.75), 2) if bucket['inp_ms'] else None
        cls_p75 = round(percentile_value(bucket['cls'], 0.75), 4) if bucket['cls'] else None
        normalized_page_types[key] = {
            'sample_size': bucket['sample_size'],
            'p75': {
                'lcp_ms': lcp_p75,
                'inp_ms': inp_p75,
                'cls': cls_p75,
            },
            'status': {
                'lcp': classify_vital('lcp_ms', lcp_p75),
                'inp': classify_vital('inp_ms', inp_p75),
                'cls': classify_vital('cls', cls_p75),
            },
        }

    response = jsonify({
        'sample_size': len(row_dicts),
        'targets': {
            'lcp_ms': 2500,
            'inp_ms': 200,
            'cls': 0.1,
            'fcp_ms': 1800,
            'ttfb_ms': 800,
        },
        'p75': p75,
        'status': {
            'lcp': classify_vital('lcp_ms', p75['lcp_ms']),
            'inp': classify_vital('inp_ms', p75['inp_ms']),
            'cls': classify_vital('cls', p75['cls']),
            'fcp': classify_vital('fcp_ms', p75['fcp_ms']),
            'ttfb': classify_vital('ttfb_ms', p75['ttfb_ms']),
        },
        'page_types': normalized_page_types,
    })
    response.headers['Cache-Control'] = 'no-store'
    return response

@app.route('/api/portfolio/sections/reorder', methods=['POST'])
@login_required
def reorder_sections(current_user):
    data = request.get_json()
    order = data.get('order', [])
    with get_db() as db:
        p = db.execute("SELECT id FROM portfolios WHERE user_id=?", (current_user['id'],)).fetchone()
        if not p: return jsonify({'error': 'Not found'}), 404
        for i, sid in enumerate(order):
            db.execute("UPDATE portfolio_sections SET order_index=? WHERE id=? AND portfolio_id=?", (i, sid, p['id']))
        db.commit()
    return jsonify({'success': True})

@app.route('/api/user/profile', methods=['PUT'])
@login_required
def update_profile(current_user):
    data = request.get_json()
    fields = {}
    if 'name' in data: fields['name'] = data['name']
    if 'bio' in data: fields['bio'] = data['bio']
    if 'avatar' in data: fields['avatar'] = data['avatar']
    if not fields: return jsonify({'error': 'Nothing to update'}), 400
    with get_db() as db:
        set_clause = ', '.join(f'{k}=?' for k in fields)
        db.execute(f"UPDATE users SET {set_clause} WHERE id=?", (*fields.values(), current_user['id']))
        db.commit()
    return jsonify({'success': True})

@app.route('/health')
def health():
    return jsonify({'status': 'ok', 'version': '2.0.0', 'timestamp': utcnow().isoformat()})

if __name__ == '__main__':
    print("\n🚀 QuickFolio Full-Stack Server Starting...")
    print("📍 URL: http://localhost:5000")
    print("📖 Manual: http://localhost:5000/manual")
    print("⚡ Builder: http://localhost:5000/builder\n")
    app.run(debug=True, host='0.0.0.0', port=5000)
