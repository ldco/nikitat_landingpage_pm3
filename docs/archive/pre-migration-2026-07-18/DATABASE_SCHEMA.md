# Database Schema (19 Tables)

**ORM:** Drizzle ORM + SQLite (better-sqlite3)  
**Source file:** `server/database/schema.ts` (855 lines) — ports directly  

---

## 1. Users & Auth

### users
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'editor' NOT NULL,  -- legacy: 'master'|'admin'|'editor'
  role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  last_failed_login TIMESTAMP,
  two_factor_enabled INTEGER DEFAULT 0,  -- boolean
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### roles
```sql
CREATE TABLE roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions TEXT NOT NULL,  -- JSON: { "users": true, "blog": false }
  level INTEGER DEFAULT 0,
  is_built_in INTEGER DEFAULT 0,  -- boolean
  color TEXT DEFAULT 'secondary',
  icon TEXT DEFAULT 'pencil',
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### sessions
```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,  -- UUID
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP
);
CREATE INDEX sessions_user_expires_idx ON sessions(user_id, expires_at);
CREATE INDEX sessions_expires_idx ON sessions(expires_at);
```

### user_2fa
```sql
CREATE TABLE user_2fa (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  secret TEXT NOT NULL,       -- Encrypted TOTP secret
  backup_codes TEXT NOT NULL, -- JSON array of hashed backup codes
  backup_codes_remaining INTEGER DEFAULT 10,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
CREATE INDEX user_2fa_user_idx ON user_2fa(user_id);
```

---

## 2. Settings

### settings
```sql
CREATE TABLE settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,          -- 'contact.email', 'social.telegram', etc.
  value TEXT,                        -- setting value
  type TEXT DEFAULT 'string' NOT NULL, -- 'string'|'number'|'boolean'|'json'
  group TEXT DEFAULT 'general',       -- admin UI grouping
  updated_at TIMESTAMP
);
```

---

## 3. Content Entities

### portfolios (portfolio collections)
```sql
CREATE TABLE portfolios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,  -- 'gallery'|'case_study'|'branding'|'brandbook'|'website'
  cover_image_url TEXT,
  cover_thumbnail_url TEXT,
  order INTEGER DEFAULT 0,
  published INTEGER DEFAULT 0,  -- boolean
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
CREATE INDEX portfolios_published_idx ON portfolios(published);
```

### portfolio_items
```sql
CREATE TABLE portfolio_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,  -- 'image'|'video'|'link'|'case_study'
  order INTEGER DEFAULT 0,
  published INTEGER DEFAULT 1,  -- boolean
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  -- Media fields (for image/video/link)
  media_url TEXT,
  thumbnail_url TEXT,
  caption TEXT,
  -- Case study fields
  slug TEXT,
  title TEXT,
  description TEXT,
  content TEXT,         -- Markdown/rich text
  tags TEXT,            -- JSON array
  category TEXT,
  published_at TIMESTAMP,
  -- Type-specific metadata (JSON blob)
  metadata TEXT
);
CREATE INDEX portfolio_items_portfolio_idx ON portfolio_items(portfolio_id);
```

### blog_posts
```sql
CREATE TABLE blog_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  category_id INTEGER REFERENCES blog_categories(id) ON DELETE SET NULL,
  cover_image_url TEXT,
  cover_image_alt TEXT,
  published INTEGER DEFAULT 0,  -- boolean
  published_at TIMESTAMP,
  reading_time_minutes INTEGER,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
CREATE INDEX blog_posts_published_idx ON blog_posts(published);
CREATE INDEX blog_posts_author_idx ON blog_posts(author_id);
CREATE INDEX blog_posts_category_idx ON blog_posts(category_id);
```

### blog_categories
```sql
CREATE TABLE blog_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  order INTEGER DEFAULT 0,
  created_at TIMESTAMP
);
```

### blog_tags
```sql
CREATE TABLE blog_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMP
);
```

### blog_post_tags (many-to-many)
```sql
CREATE TABLE blog_post_tags (
  post_id INTEGER NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES blog_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP
);
CREATE INDEX blog_post_tags_post_idx ON blog_post_tags(post_id);
CREATE INDEX blog_post_tags_tag_idx ON blog_post_tags(tag_id);
```

### blog_media
```sql
CREATE TABLE blog_media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  type TEXT NOT NULL,  -- 'image'|'video'
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  alt TEXT,
  width INTEGER,
  height INTEGER,
  size_bytes INTEGER,
  order INTEGER DEFAULT 0,
  created_at TIMESTAMP
);
CREATE INDEX blog_media_post_idx ON blog_media(post_id);
```

### faq_items
```sql
CREATE TABLE faq_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  category TEXT,
  published INTEGER DEFAULT 1,  -- boolean
  order INTEGER DEFAULT 0,
  created_at TIMESTAMP
);
CREATE INDEX faq_items_published_idx ON faq_items(published);
```

### features
```sql
CREATE TABLE features (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  hover_image_url TEXT,
  category TEXT,
  published INTEGER DEFAULT 1,  -- boolean
  order INTEGER DEFAULT 0,
  created_at TIMESTAMP
);
CREATE INDEX features_published_idx ON features(published);
```

### pricing_tiers
```sql
CREATE TABLE pricing_tiers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,  -- 'starter', 'pro', 'enterprise'
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER,              -- in cents (null = custom/contact)
  currency TEXT DEFAULT 'USD',
  period TEXT DEFAULT 'month',  -- 'month'|'year'|'one-time'
  featured INTEGER DEFAULT 0,   -- boolean
  cta_text TEXT,
  cta_url TEXT DEFAULT '/contact',
  order INTEGER DEFAULT 0,
  published INTEGER DEFAULT 1,  -- boolean
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### pricing_features (per-tier feature list)
```sql
CREATE TABLE pricing_features (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tier_id INTEGER NOT NULL REFERENCES pricing_tiers(id) ON DELETE CASCADE,
  text TEXT NOT NULL,        -- feature description (fallback)
  included INTEGER DEFAULT 1,  -- boolean: ✓ or ✗
  order INTEGER DEFAULT 0,
  created_at TIMESTAMP
);
CREATE INDEX pricing_features_tier_idx ON pricing_features(tier_id);
```

### clients
```sql
CREATE TABLE clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  website_url TEXT,
  category TEXT DEFAULT 'client',  -- 'client'|'sponsor'|'partner'
  featured INTEGER DEFAULT 0,      -- boolean
  published INTEGER DEFAULT 1,     -- boolean
  order INTEGER DEFAULT 0,
  created_at TIMESTAMP
);
CREATE INDEX clients_published_idx ON clients(published);
```

### team_members
```sql
CREATE TABLE team_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  position TEXT,
  bio TEXT,
  photo_url TEXT,
  hover_photo_url TEXT,
  email TEXT,
  phone TEXT,
  department TEXT,
  social_links TEXT,     -- JSON: {linkedin, twitter, github}
  published INTEGER DEFAULT 1,  -- boolean
  order INTEGER DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
CREATE INDEX team_members_published_idx ON team_members(published);
```

### testimonials
```sql
CREATE TABLE testimonials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author_name TEXT NOT NULL,
  author_title TEXT,
  author_company TEXT,
  author_photo_url TEXT,
  rating INTEGER,  -- 1-5
  featured INTEGER DEFAULT 0,  -- boolean
  published INTEGER DEFAULT 1,  -- boolean
  order INTEGER DEFAULT 0,
  created_at TIMESTAMP
);
CREATE INDEX testimonials_published_idx ON testimonials(published);
```

### contact_submissions
```sql
CREATE TABLE contact_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  consent INTEGER DEFAULT 0,  -- boolean
  read INTEGER DEFAULT 0,     -- boolean (admin has read it)
  created_at TIMESTAMP
);
```

---

## 4. Translations

### translations (database-driven i18n)
```sql
CREATE TABLE translations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  locale TEXT NOT NULL,  -- 'ru'|'en'|'fr'|'he'
  key TEXT NOT NULL,     -- 'hero.title', 'nav.about', 'portfolio.1.name'
  value TEXT NOT NULL,
  updated_at TIMESTAMP,
  UNIQUE(locale, key)
);
```

---

## 5. Audit

### audit_logs
```sql
CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,  -- 'login'|'logout'|'user_create'|'role_change'|etc.
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,    -- actor
  target_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- affected
  ip_address TEXT,
  user_agent TEXT,
  details TEXT,          -- JSON with context
  success INTEGER DEFAULT 1,  -- boolean
  created_at TIMESTAMP
);
CREATE INDEX audit_logs_created_idx ON audit_logs(created_at);
CREATE INDEX audit_logs_action_idx ON audit_logs(action);
```

---

## 6. Translation Tables (per-entity)

Each content entity follows this pattern:

```sql
CREATE TABLE X_translations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  X_id INTEGER NOT NULL REFERENCES X(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  -- entity-specific translated fields
  updated_at TIMESTAMP,
  UNIQUE(X_id, locale)
);
```

Specifically: `pricing_tier_translations`, `pricing_feature_translations`,  
`team_member_translations`, `blog_post_translations`, `blog_category_translations`,  
`faq_item_translations`, `feature_translations`, `testimonial_translations`.

---

## 7. Entity Relationships

```
users 1──N sessions
users 1──1 user_2fa
users N──1 roles (via role_id)

portfolios 1──N portfolio_items
portfolios 1──N portfolio_translations  (via translations key='portfolio.{id}.*')
portfolio_items 1──N item_translations  (via translations key='portfolio_item.{id}.*')

blog_posts N──1 blog_categories
blog_posts N──N blog_tags (via blog_post_tags)
blog_posts 1──N blog_post_translations
blog_posts 1──N blog_media
blog_categories 1──N blog_category_translations

pricing_tiers 1──N pricing_features
pricing_tiers 1──N pricing_tier_translations
pricing_features 1──N pricing_feature_translations

faq_items 1──N faq_item_translations
features 1──N feature_translations
team_members 1──N team_member_translations
testimonials 1──N testimonial_translations
```
