#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════════
# pm-vanilla — Strip a client project back to vanilla Puppet Master framework
# ═══════════════════════════════════════════════════════════════════════════════
#
# Usage:
#   bash scripts/pm-vanilla.sh           # Interactive (asks before destructive ops)
#   bash scripts/pm-vanilla.sh --yes     # Non-interactive (auto-confirms)
#
# What it does:
#   1. Resets pmMode → 'unconfigured' in config
#   2. Resets colors to PM defaults (#2f2f2f / #f0f0f0 / #aa0000 / #0f172a)
#   3. Resets footerMadeBy to PM defaults
#   4. Resets sections to vanilla baseline (home, features, faq, contact)
#   5. Resets locales to ['en'] only, defaultLocale to 'en'
#   6. Disables all modules except features + faq (as demo)
#   7. Disables client-specific features
#   8. Deletes data/sqlite.db + .db-wal + .db-shm
#   9. Resets .env from .env.example (PM_MODE=unconfigured)
#  10. Replaces i18n/content.ts with minimal empty file
#  11. Removes client-specific sections (not in vanilla list)
#  12. Removes client CSS overrides from app/assets/css/runtime/
#  13. Removes client images (public/images/, favicon, og-image)
#  14. Removes non-English logos from public/logos/
#  15. Removes client concept_docs
#  16. Cleans generated/ directory
#  17. Cleans backup config files
#
# What is NEVER touched:
#   - pm-core/
#   - public/puppetmaster/
#   - public/madebylogos/
#   - i18n/system-seed.json
#   - server/database/schema.ts
#   - app/assets/css/ (except runtime/ client overrides)
#   - app/components/atoms/, molecules/, organisms/
#   - Framework section components (SectionHero, SectionFeatures, etc.)
#   - .env.example, scripts/, docs/, ansible/, Dockerfile
# ═══════════════════════════════════════════════════════════════════════════════

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

AUTO_YES=false
[[ "${1:-}" == "--yes" ]] && AUTO_YES=true

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

log_info()  { printf "${CYAN}•${NC} %s\n" "$*"; }
log_ok()    { printf "${GREEN}✓${NC} %s\n" "$*"; }
log_warn()  { printf "${YELLOW}⚠${NC} %s\n" "$*"; }
log_error() { printf "${RED}✗${NC} %s\n" "$*" >&2; }
log_step()  { printf "\n${BOLD}${CYAN}── %s${NC}\n" "$*"; }

confirm() {
  if $AUTO_YES; then return 0; fi
  printf "${YELLOW}?${NC} %s [y/N] " "$1"
  read -r answer
  [[ "$answer" == "y" || "$answer" == "Y" ]]
}

# ── Sanity checks ────────────────────────────────────────────────────────────

if [[ ! -f "project/puppet-master.config.ts" ]]; then
  log_error "Not a Puppet Master project root: $ROOT"
  exit 1
fi

echo ""
printf "${BOLD}${CYAN}╔══════════════════════════════════════════════════════╗${NC}\n"
printf "${BOLD}${CYAN}║   PM Vanilla — Strip to Clean Framework Baseline    ║${NC}\n"
printf "${BOLD}${CYAN}╚══════════════════════════════════════════════════════╝${NC}\n"
echo ""
echo "This will REMOVE all client-project content and reset to"
echo "a clean Puppet Master framework starting point."
echo ""
echo "PRESERVED (never touched):"
echo "  • pm-core/                    Framework core"
echo "  • public/puppetmaster/        PM branding"
echo "  • public/madebylogos/      Developer attribution"
echo "  • app/components/(atoms,molecules,organisms)  Framework components"
echo "  • i18n/system-seed.json       System translations"
echo "  • server/database/schema.ts   Database schema"
echo "  • app/assets/css/             Global CSS (except client runtime overrides)"
echo "  • server/utils/, server/api/  Framework backend"
echo "  • .env.example, Dockerfile, scripts/, docs/, ansible/"
echo ""
echo "REMOVED (client-project layer):"
echo "  • All database content (data/sqlite.db)"
echo "  • Client custom sections (About, Focus, F22, etc.)"
echo "  • Client images, logos, favicons"
echo "  • Client translations (i18n/content.ts)"
echo "  • Client concept docs"
echo "  • Client CSS overrides"
echo "  • Config reset: colors, sections, locales, modules → PM defaults"
echo "  • .env regenerated from .env.example"
echo ""

if ! confirm "Continue? This is DESTRUCTIVE and cannot be undone."; then
  echo "Aborted."
  exit 0
fi

# ═══════════════════════════════════════════════════════════════════════════════
# 1. RESET CONFIG → VANILLA DEFAULTS
# ═══════════════════════════════════════════════════════════════════════════════
log_step "1/8  Resetting puppet-master.config.ts to vanilla defaults"

CONFIG="project/puppet-master.config.ts"
if [[ ! -f "$CONFIG" ]]; then
  log_error "Config file not found: $CONFIG"
  exit 1
fi

# pmMode → unconfigured
sed -i "s/pmMode: *'[^']*'/pmMode: 'unconfigured'/" "$CONFIG"
log_ok "pmMode → 'unconfigured'"

# Colors → PM defaults
sed -i "s/black: *'[^']*'/black: '#2f2f2f'/" "$CONFIG"
sed -i "s/white: *'[^']*'/white: '#f0f0f0'/" "$CONFIG"
sed -i "s/brand: *'[^']*'/brand: '#aa0000'/" "$CONFIG"
sed -i "s/accent: *'[^']*'/accent: '#0f172a'/" "$CONFIG"
log_ok "Colors → PM defaults (#2f2f2f, #f0f0f0, #aa0000, #0f172a)"

# locales → ['en'] only, defaultLocale → 'en'
sed -i "/{ code: 'ru'/,/}/d" "$CONFIG"
sed -i "/{ code: 'fr'/,/}/d" "$CONFIG"
sed -i "/{ code: 'he'/,/}/d" "$CONFIG"
sed -i "s/defaultLocale: *'[^']*'/defaultLocale: 'en'/" "$CONFIG"
log_ok "Locales → [en] only, defaultLocale → 'en'"

# footerMadeBy → PM defaults
sed -i "/url: 'https:\/\/fabrica22\.pro'/s|'https://fabrica22\.pro'|'/'|" "$CONFIG"
sed -i "/logoAlt: 'Fabrica 22'/s|'Fabrica 22'|'Puppet Master'|" "$CONFIG"
# Remove non-EN logo variants from available list
sed -i "/'horizontal_dark_ru'/,/'horizontal_light_ru'/d" "$CONFIG"
sed -i "/'circle_dark_ru'/,/'circle_light_ru'/d" "$CONFIG"
# Remove extra langFallback entries (keep only en)
sed -i "/fr: 'en'/d" "$CONFIG"
sed -i "/he: 'en'/d" "$CONFIG"
log_ok "footerMadeBy → PM defaults"

# Features: disable client-specific ones
sed -i "s/scrollytelling: *true/scrollytelling: false/" "$CONFIG"
sed -i "s/onepager: *true/onepager: true/" "$CONFIG"  # keep onepager as default
log_ok "Features → reset client-specific toggles"

# Modules: disable client-enabled, re-enable only features + faq for demo
sed -i '/pricing: {/,/^    },/ s/enabled: true/enabled: false/' "$CONFIG" 2>/dev/null || true
sed -i '/blog: {/,/^    },/ s/enabled: true/enabled: false/' "$CONFIG" 2>/dev/null || true
sed -i '/contact: {/,/^    },/ s/enabled: true/enabled: false/' "$CONFIG" 2>/dev/null || true
sed -i '/features: {/,/^    },/ s/enabled: false/enabled: true/' "$CONFIG" 2>/dev/null || true
log_ok "Modules → reset to vanilla defaults"

# Sections → vanilla baseline (home, features, faq, contact)
log_info "Sections listed in config may need manual review."
log_info "Vanilla baseline: home, features, faq, contact"

# Admin RBAC: reset to open defaults
sed -i "/users: {/,/}/s/roles: \['master'\]/roles: ['master', 'admin']/" "$CONFIG" 2>/dev/null || true
sed -i "/blog: {/,/}/s/enabled: false/enabled: true/" "$CONFIG" 2>/dev/null || true
sed -i "/portfolio: {/,/}/s/enabled: false/enabled: true/" "$CONFIG" 2>/dev/null || true
log_ok "Admin RBAC → standard defaults"

# ═══════════════════════════════════════════════════════════════════════════════
# 2. DELETE DATABASE
# ═══════════════════════════════════════════════════════════════════════════════
log_step "2/8  Deleting database"

rm -f data/sqlite.db data/sqlite.db-wal data/sqlite.db-shm
log_ok "Database deleted"
mkdir -p data
touch data/.gitkeep 2>/dev/null || true

# ═══════════════════════════════════════════════════════════════════════════════
# 3. RESET .env
# ═══════════════════════════════════════════════════════════════════════════════
log_step "3/8  Resetting .env from .env.example"

if [[ -f ".env.example" ]]; then
  cp .env.example .env
  sed -i 's/PM_MODE=build/PM_MODE=unconfigured/' .env 2>/dev/null || true
  sed -i 's/PM_MODE=develop/PM_MODE=unconfigured/' .env 2>/dev/null || true
  log_ok ".env regenerated (PM_MODE=unconfigured)"
else
  log_warn ".env.example not found, .env left as-is"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# 4. RESET CLIENT TRANSLATIONS
# ═══════════════════════════════════════════════════════════════════════════════
log_step "4/8  Resetting client translations"

if [[ -f "i18n/content.ts" ]]; then
  cat > i18n/content.ts << 'I18NEOF'
import config from '~~/project/puppet-master.config'

export function getContentSeedData(): Array<{
  locale: string
  key: string
  value: string
}> {
  return []
}
I18NEOF
  log_ok "i18n/content.ts → empty (framework defaults only)"
else
  log_warn "i18n/content.ts not found, skipped"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# 5. REMOVE CLIENT SECTIONS (keep only framework ones)
# ═══════════════════════════════════════════════════════════════════════════════
log_step "5/8  Removing client-specific sections"

VANILLA_SECTIONS=(
  "SectionHero"
  "SectionFeatures"
  "SectionFaq"
  "SectionContact"
  "SectionBlog"
  "SectionPricing"
  "SectionPortfolio"
  "SectionTeam"
  "SectionTestimonials"
  "SectionClients"
)

sections_dir="app/components/sections"
removed_count=0
if [[ -d "$sections_dir" ]]; then
  for f in "$sections_dir"/*.vue; do
    [[ -f "$f" ]] || continue
    basename=$(basename "$f" .vue)
    keep=false
    for vanilla in "${VANILLA_SECTIONS[@]}"; do
      [[ "$basename" == "$vanilla" ]] && keep=true && break
    done
    if ! $keep; then
      log_info "Removing: $f"
      rm -f "$f"
      ((removed_count++)) || true
    fi
  done
fi
[[ $removed_count -gt 0 ]] && log_ok "Removed $removed_count client-specific section(s)"
[[ $removed_count -eq 0 ]] && log_info "No client sections to remove"

# ═══════════════════════════════════════════════════════════════════════════════
# 6. REMOVE CLIENT FILES
# ═══════════════════════════════════════════════════════════════════════════════
log_step "6/8  Removing client assets"

# Client CSS runtime overrides
rm -f app/assets/css/runtime/section-about.css
rm -f app/assets/css/runtime/section-focus.css
rm -f app/assets/css/runtime/section-f22.css
log_ok "Client CSS overrides removed"

# Client images
rm -f public/images/frame_0019.png 2>/dev/null
rm -rf public/images/about/ 2>/dev/null
rm -f public/images/about/2.png 2>/dev/null
rm -f public/images/about/2_r.png 2>/dev/null
log_ok "Client images removed"

# Non-English logos
if [[ -d "public/logos" ]]; then
  removed_logos=0
  for f in public/logos/*_ru.svg public/logos/*_fr.svg public/logos/*_he.svg; do
    [[ -f "$f" ]] || continue
    rm -f "$f"
    ((removed_logos++)) || true
  done
  [[ $removed_logos -gt 0 ]] && log_ok "Removed $removed_logos non-English logo variant(s)"
fi

# Client favicon and social images
rm -f public/favicon.svg 2>/dev/null
rm -f public/og-image.png 2>/dev/null
rm -f public/og-image.svg 2>/dev/null
rm -f public/robots.txt 2>/dev/null
log_ok "Client favicon/og-image/robots removed"

# Client concept docs
if [[ -d "project/init/concept_docs" ]]; then
  removed_concepts=0
  for f in project/init/concept_docs/*.md; do
    [[ -f "$f" ]] || continue
    basename=$(basename "$f")
    [[ "$basename" == "README.md" ]] && continue
    rm -f "$f"
    ((removed_concepts++)) || true
  done
  [[ $removed_concepts -gt 0 ]] && log_ok "Removed $removed_concepts client concept doc(s)"
fi

# Generated directory
rm -rf project/init/generated/
log_ok "Generated context cleaned"

# Config backups
rm -f project/puppet-master.config.ts.backup.* 2>/dev/null
log_ok "Config backups removed"

# ═══════════════════════════════════════════════════════════════════════════════
# 7. CLEAN CACHES
# ═══════════════════════════════════════════════════════════════════════════════
log_step "7/8  Cleaning caches"

rm -rf .nuxt .nuxt-old .nuxt-root .output 2>/dev/null
log_ok "Build caches removed"

# ═══════════════════════════════════════════════════════════════════════════════
# 8. VERIFY BASELINE INTEGRITY
# ═══════════════════════════════════════════════════════════════════════════════
log_step "8/8  Verifying baseline integrity"

errors=0

# Framework core must exist
[[ -d "pm-core" ]] || { log_error "MISSING: pm-core/"; ((errors++)); }
[[ -d "public/puppetmaster" ]] || log_warn "Missing: public/puppetmaster/"
[[ -d "public/madebylogos" ]] || log_warn "Missing: public/madebylogos/"
[[ -f "i18n/system-seed.json" ]] || { log_error "MISSING: i18n/system-seed.json"; ((errors++)); }
[[ -f "server/database/schema.ts" ]] || { log_error "MISSING: server/database/schema.ts"; ((errors++)); }
[[ -f ".env.example" ]] || log_warn "Missing: .env.example"

# Framework sections must exist
for section in "${VANILLA_SECTIONS[@]}"; do
  [[ -f "app/components/sections/${section}.vue" ]] || log_warn "Missing framework section: ${section}.vue"
done

# Client sections must be gone
for f in app/components/sections/SectionAbout.vue app/components/sections/SectionFocus.vue app/components/sections/SectionF22.vue; do
  [[ -f "$f" ]] && { log_warn "Still present (should be removed): $f"; }
done

if [[ $errors -eq 0 ]]; then
  log_ok "Baseline integrity: PASS"
else
  log_error "Baseline integrity: $errors error(s)"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
printf "${BOLD}${GREEN}════════════════════════════════════════════════════════${NC}\n"
printf "${BOLD}${GREEN}  Project stripped to vanilla PM framework baseline${NC}\n"
printf "${BOLD}${GREEN}════════════════════════════════════════════════════════${NC}\n"
echo ""
echo "Next steps:"
echo "  1. npm install"
echo "  2. npm run dev"
echo "  3. Open http://localhost:3000/init"
echo "  4. Run the wizard to configure your new project"
echo ""
echo "Or for greenfield agent-driven setup:"
echo "  • Fill out project/init/GREENFIELD_PROJECT_START_PROMPT.md"
echo "  • Add concept docs to project/init/concept_docs/"
echo "  • Run: npm run pm-init-green"
echo ""
echo "NPM scripts for the new project:"
echo "  npm run db:seed      Seed fresh database"
echo "  npm run deploy       Deploy to VPS"
echo "  npm run init         Re-run setup wizard"
