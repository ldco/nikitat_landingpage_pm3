# Hero Section — GSAP Inline SVG Animation Plan

## Goal
Replace the 4 static hero logo SVG files with 2 unified inline SVG components (EN + RU) that use CSS variables for dual-theme support and GSAP for a choreographed 3-phase entrance animation: **origami fold-in** → **handwriting reveal** → **typing effect**, with mouse parallax polish.

## Context
- **Framework:** Nuxt 4 / Puppet Master (build mode, onepager, dual-locale ru+en, dual-theme)
- **Hero component:** `app/components/sections/SectionHero.vue` (left-aligned layout, title segmentation, CTA buttons)
- **PM conventions:** global CSS only, BEM naming, 5-layer CSS, `<script setup lang="ts">`, typed props, no scoped styles
- **Existing pattern to follow:** `app/components/molecules/HeroParallaxScene.vue` (ClientOnly wrapper, `aria-hidden="true"`, dynamic CSS import)
- **GSAP:** NOT currently installed. GSAP is now 100% free (all plugins). Both DrawSVGPlugin and TextPlugin are available.

---

## Color Analysis (Extracted from Source SVGs)

### Dark Theme Colors
| Element | EN dark | RU dark |
|---------|---------|---------|
| Face primary facets | `#999999` | `#999999` |
| Face highlight facets | `#cccccc` | `#cccccc` |
| Signature text | `#999999` | `#999999` |
| Tagline text | `#999999` | `#999999` |

### Light Theme Colors
| Element | EN light | RU light |
|---------|----------|----------|
| Face primary facets | `#333333` | `#333333` |
| Face highlight facets | `#666666` | `#666666` |
| Face accent (one path) | `#4d4d4d` | `#4d4d4d` |
| Signature text | `#333333` | `#333333` |
| Tagline text | `#333333` | `#333333` |

### CSS Variable Mapping
```css
--hero-logo-face-primary:   light-dark(#333333, #999999);
--hero-logo-face-highlight: light-dark(#666666, #cccccc);
--hero-logo-face-accent:    light-dark(#4d4d4d, #999999);
--hero-logo-text:           light-dark(#333333, #999999);
```

Note: The framework's configured primitives (`--p-black: #333333`, `--p-white: #cccccc`, `--p-brand: #666666`) happen to align closely with these hero logo colors, but using dedicated hero-logo variables isolates the logo theming from framework changes.

---

## Face Geometry Structure (9 Paths, Identical Between EN/RU)

The geometric half-face profile consists of these polygon paths (EN path IDs → RU path IDs):

| Role | EN path ID | RU path ID | Fill variable |
|------|-----------|-----------|---------------|
| Forehead/crown facet | path635 | path217 | `--hero-logo-face-primary` |
| Nose/eye complex | path627 | path201 | `--hero-logo-face-primary` |
| Highlight triangle A | path628 | path203 | `--hero-logo-face-highlight` |
| Chin/lower face | path629 | path204 | `--hero-logo-face-primary` |
| Highlight triangle B | path630 | path205 | `--hero-logo-face-highlight` |
| Jaw/neck polygon | path631 | path206 | `--hero-logo-face-primary` |
| Highlight triangle C | path632 | path207 | `--hero-logo-face-highlight` |
| Neck base (accent) | path633 | path213 | `--hero-logo-face-accent` |
| Full profile silhouette | path634 | path214 | `--hero-logo-face-primary` |

The face geometry is **structurally identical** between EN and RU versions — only the coordinate space differs due to Inkscape transforms. Extract the face from ONE version and normalize coordinates.

---

## Task List

### TASK 1: Install GSAP
- Run `npm install gsap`
- No nuxt.config.ts changes needed — GSAP is imported directly in components (no SSR, ClientOnly-wrapped)
- Verify: `ls node_modules/gsap` exists

### TASK 2: Create CSS Variables File
**New file:** `app/assets/css/ui/content/hero-logo.css`

```css
/* Hero Animated Logo — CSS Variables & Base Styles */
/* Imported in ui/content/index.css, lives in layer(components) */

:root {
  --hero-logo-face-primary:   light-dark(#333333, #999999);
  --hero-logo-face-highlight: light-dark(#666666, #cccccc);
  --hero-logo-face-accent:    light-dark(#4d4d4d, #999999);
  --hero-logo-text:           light-dark(#333333, #999999);
}

/* Container for the animated logo SVG */
.hero-logo-animated {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.hero-logo-animated svg {
  width: 100%;
  height: 100%;
  display: block;
}

/* Typing cursor blink */
.hero-logo-typing-cursor {
  display: inline;
  animation: hero-logo-cursor-blink 0.8s step-end infinite;
  color: var(--hero-logo-text);
}

@keyframes hero-logo-cursor-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* Face facets — initial hidden state (GSAP reveals them) */
.hero-logo-face-facet {
  opacity: 0;
  transform-origin: var(--facet-origin-x, 50%) var(--facet-origin-y, 50%);
  will-change: transform, opacity;
}

/* Signature paths — initial hidden for DrawSVGPlugin */
.hero-logo-signature-path {
  visibility: hidden;
}

/* Typing text element */
.hero-logo-typing-text {
  font-family: 'PT Mono', monospace;
  font-weight: bold;
  fill: var(--hero-logo-text);
}

/* Reduced motion: show everything instantly, no animations */
@media (prefers-reduced-motion: reduce) {
  .hero-logo-face-facet {
    opacity: 1;
  }
  .hero-logo-signature-path {
    visibility: visible;
  }
  .hero-logo-typing-cursor {
    display: none;
  }
}
```

**Modify:** `app/assets/css/ui/content/index.css` — add `@import './hero-logo.css';` at the end.

### TASK 3: Create Unified Inline SVG Components

**New file:** `app/components/molecules/HeroAnimatedLogoEn.vue`

This contains the English version: face geometry + "Roman Zinnatov" signature paths + "IT Consulting" typing text. Structure:

```vue
<script setup lang="ts">
// Placeholder — animation logic lives in the orchestrator (TASK 6)
// This component is a pure SVG template
</script>

<template>
  <svg viewBox="0 0 162 297" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <!-- ===== FACE GEOMETRY (shared with RU) ===== -->
    <g class="hero-logo-face">
      <!-- path627: nose/eye (primary) -->
      <path class="hero-logo-face-facet" style="--facet-origin-x: 60%; --facet-origin-y: 40%"
            fill="var(--hero-logo-face-primary)"
            d="M 137.571,-192.006 L 146.549,-198.699 L 140.422,-207.16 H 152.021 V -168.003 H 131.619 Z" />
      <!-- path628: highlight triangle A -->
      <path class="hero-logo-face-facet" style="--facet-origin-x: 30%; --facet-origin-y: 50%"
            fill="var(--hero-logo-face-highlight)"
            d="M 137.571,-192.006 L 131.618,-168.003 L 115.662,-215.473 Z" />
      <!-- path629: chin (primary) -->
      <path class="hero-logo-face-facet" style="--facet-origin-x: 50%; --facet-origin-y: 70%"
            fill="var(--hero-logo-face-primary)"
            d="M 131.619,-168.003 L 103.154,-196.768 L 115.662,-215.473 Z" />
      <!-- path630: highlight triangle B -->
      <path class="hero-logo-face-facet" style="--facet-origin-x: 40%; --facet-origin-y: 60%"
            fill="var(--hero-logo-face-highlight)"
            d="M 115.662,-215.473 L 103.154,-196.768 V -232.276 Z" />
      <!-- path631: jaw/neck (primary) -->
      <path class="hero-logo-face-facet" style="--facet-origin-x: 50%; --facet-origin-y: 80%"
            fill="var(--hero-logo-face-primary)"
            d="M 103.154,-232.276 V -196.768 L 87.779,-230.032 L 87.183,-238.708 L 95.226,-250.549 Z" />
      <!-- path632: highlight triangle C -->
      <path class="hero-logo-face-facet" style="--facet-origin-x: 30%; --facet-origin-y: 70%"
            fill="var(--hero-logo-face-highlight)"
            d="M 95.226,-250.549 L 87.183,-238.708 L 83.961,-285.648 L 87.623,-287.842 Z" />
      <!-- path633: neck base (accent) -->
      <path class="hero-logo-face-facet" style="--facet-origin-x: 50%; --facet-origin-y: 90%"
            fill="var(--hero-logo-face-accent)"
            d="M 98.110,-309.499 L 102.341,-317.447 L 112.420,-322.851 L 136.443,-317.508 L 139.640,-309.453 L 114.175,-315.238 Z" />
      <!-- path635: forehead/crown (primary) -->
      <path class="hero-logo-face-facet" style="--facet-origin-x: 60%; --facet-origin-y: 20%"
            fill="var(--hero-logo-face-primary)"
            d="M 115.662,-215.473 L 109.408,-223.875 L 117.164,-237.152 L 142.005,-246.262 L 152.021,-240.798 V -232.277 H 151.170 L 147.694,-233.875 L 121.507,-230.032 Z" />
      <!-- path634: full profile outline (primary) -->
      <path class="hero-logo-face-facet" style="--facet-origin-x: 50%; --facet-origin-y: 50%"
            fill="var(--hero-logo-face-primary)"
            d="M 87.188,-311.458 L 87.623,-287.842 L 83.961,-285.648 L 80.593,-308.559 L 79.094,-322.133 L 87.584,-360.718 L 115.842,-387.998 L 149.090,-397.002 H 152.539 V -394.551 V -365.522 H 149.090 L 118.152,-376.059 L 95.023,-354.559 L 95.687,-330.914 Z" />
    </g>

    <!-- ===== SIGNATURE: "Roman Zinnatov" (handwriting paths) ===== -->
    <g class="hero-logo-signature" fill="none" stroke="var(--hero-logo-text)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <!-- Each letter converted to a stroke-path for DrawSVGPlugin -->
      <!-- CRITICAL: These paths need to be extracted as stroked center-lines from the source SVGs -->
      <!-- For the cursive script font "Passions Conflict", use the filled outline paths
           but render them as stroke (fill="none" stroke="...") for DrawSVGPlugin -->
      <!-- PLACEHOLDER: Replace with actual center-line paths from SVG extraction -->
      <path class="hero-logo-signature-path" d="..." />
      <!-- ... more signature letter paths ... -->
    </g>

    <!-- ===== TAGLINE: "IT Consulting" (typing effect) ===== -->
    <text class="hero-logo-typing-text" x="50%" y="280" text-anchor="middle" font-size="12">
      <tspan class="hero-logo-typing-cursor">|</tspan>
    </text>
  </svg>
</template>
```

**IMPORTANT NOTE:** The `d` attributes above use **placeholder coordinates**. The actual path data must be extracted from the source SVGs with coordinates normalized relative to a clean viewBox. The face geometry is shared across EN/RU — extract it once. The signature paths differ per language.

### TASK 4: SVG Path Extraction & Normalization

This is the most labor-intensive task. Process each source SVG:

1. **Open each SVG in Inkscape** (EN dark, RU dark):
   - Ungroup everything
   - Remove Inkscape namespaces (`sodipodi:`, `inkscape:`)
   - Remove `<sodipodi:namedview>`, `<defs>`
   - Flatten transforms: apply `Object → Ungroup` repeatedly until no groups remain

2. **Extract face geometry** from ONE version (e.g., EN dark) as the canonical face:
   - Identify the 9 face paths (path627–635 in EN, path201–217 in RU)
   - Their shape is identical; coordinate differences come from parent group transforms
   - Set viewBox to tightly fit the face geometry (approximate: `0 0 170 300`)

3. **Extract signature paths** per language:
   - **EN signature:** Paths from `hero_logo_en_dark_theme.svg` (path653–660 + g665)
   - **RU signature:** Paths from `hero_logo_ru_dark_theme.svg` (paths in g67/g65 groups)
   - For DrawSVGPlugin to work, these filled outlines must be rendered as `fill="none" stroke="var(--hero-logo-text)" stroke-width="2"`
   - **Critical:** The "Passions Conflict RUS" font produces filled outlines that, when stroked, trace the **perimeter** of each letter. For thin cursive script this looks acceptable as handwriting. For best results, consider exporting center-line strokes from the original font file instead.

4. **Extract tagline text:**
   - EN: "IT Consulting" (from `text666` path — but this is a `<path>` with `aria-label`, not `<text>`. Convert to actual `<text>` element.)
   - RU: "IT Консалтинг" (from `text67` path — same conversion needed)

### TASK 5: Create the Orchestrator Molecule

**New file:** `app/components/molecules/HeroAnimatedLogo.vue`

This is the main component that:
- Detects current locale
- Renders the correct inline SVG variant
- Runs the GSAP timeline
- Handles mouse parallax post-animation
- Cleans up on unmount

Key implementation details:

```vue
<script setup lang="ts">
import { gsap } from 'gsap'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { TextPlugin } from 'gsap/TextPlugin'

gsap.registerPlugin(DrawSVGPlugin, TextPlugin)

const { locale } = useI18n()
const containerRef = ref<HTMLElement | null>(null)
const svgRef = ref<SVGSVGElement | null>(null)
const tl = ref<gsap.core.Timeline | null>(null)
const isReducedMotion = ref(false)
let parallaxCleanup: (() => void) | null = null

const taglineText = computed(() =>
  locale.value.startsWith('ru') ? 'IT Консалтинг' : 'IT Consulting'
)
const isRu = computed(() => locale.value.startsWith('ru'))

// ===== GSAP Timeline =====
function buildTimeline() {
  if (!svgRef.value) return

  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.out' } })

  // --- Phase 1: Origami Fold-In (face facets) ---
  // Each facet scales from 0 → 1 and rotates from a folded angle
  // transformOrigin is set per-facet via CSS custom properties
  const facets = svgRef.value.querySelectorAll('.hero-logo-face-facet')
  
  tl.fromTo(facets, {
    scale: 0,
    rotation: -15,
    opacity: 0,
  }, {
    scale: 1,
    rotation: 0,
    opacity: 1,
    duration: 0.6,
    stagger: {
      each: 0.08,
      from: 'start',
      grid: 'auto',
    },
    ease: 'back.out(1.4)',
    // Per-facet transformOrigin is set in CSS via --facet-origin-* vars
  })

  // --- Phase 2: Handwriting Effect ---
  // DrawSVGPlugin animates stroke-dashoffset from full length → 0
  const signaturePaths = svgRef.value.querySelectorAll('.hero-logo-signature-path')
  
  tl.fromTo(signaturePaths, {
    drawSVG: '0%',
    visibility: 'visible',
  }, {
    drawSVG: '100%',
    duration: 2.5,
    stagger: 0.15,
    ease: 'power1.inOut',
  }, '-=0.3')  // overlap with end of fold-in

  // --- Phase 3: Typing Effect ---
  const typingEl = svgRef.value.querySelector('.hero-logo-typing-cursor')
  const typingTextEl = svgRef.value.querySelector('.hero-logo-typing-text')
  
  if (typingTextEl) {
    tl.to(typingTextEl, {
      text: {
        value: taglineText.value,
        speed: 0.08,
        delimiter: '',
      },
      duration: taglineText.value.length * 0.08,
      ease: 'none',
    }, '-=0.2')
  }

  // Remove cursor after typing
  if (typingEl) {
    tl.to(typingEl, {
      opacity: 0,
      duration: 0.3,
    }, '+=0.5')
  }

  // --- Phase 4: Subtle breathing after completion ---
  tl.to(facets, {
    scale: 1.02,
    duration: 3,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
  }, '+=1')

  return tl
}

// ===== Mouse Parallax =====
function setupParallax() {
  if (!containerRef.value || !svgRef.value) return

  const facets = svgRef.value.querySelectorAll('.hero-logo-face-facet')
  const maxMove = 8 // pixels of max parallax displacement

  const onMouseMove = (e: MouseEvent) => {
    const rect = containerRef.value!.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5   // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5   // -0.5 to 0.5

    facets.forEach((facet, i) => {
      const depth = 1 + (i % 3) * 0.5  // varying depth layers
      gsap.to(facet, {
        x: x * maxMove * depth,
        y: y * maxMove * depth,
        duration: 0.6,
        ease: 'power2.out',
        overwrite: 'auto',
      })
    })
  }

  const onMouseLeave = () => {
    gsap.to(facets, {
      x: 0,
      y: 0,
      duration: 0.8,
      ease: 'power2.out',
    })
  }

  containerRef.value.addEventListener('mousemove', onMouseMove, { passive: true })
  containerRef.value.addEventListener('mouseleave', onMouseLeave)

  return () => {
    containerRef.value?.removeEventListener('mousemove', onMouseMove)
    containerRef.value?.removeEventListener('mouseleave', onMouseLeave)
  }
}

// ===== Lifecycle =====
onMounted(() => {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  isReducedMotion.value = mq.matches

  if (!isReducedMotion.value) {
    nextTick(() => {
      tl.value = buildTimeline()
      tl.value?.play()

      // Attach parallax after timeline completes (or immediately for reduced-motion users)
      tl.value?.eventCallback('onComplete', () => {
        parallaxCleanup = setupParallax()
      })
    })
  }
})

onBeforeUnmount(() => {
  tl.value?.kill()
  parallaxCleanup?.()
})
</script>

<template>
  <ClientOnly>
    <div ref="containerRef" class="hero-logo-animated" aria-hidden="true">
      <svg ref="svgRef" viewBox="0 0 170 300" xmlns="http://www.w3.org/2000/svg">
        <!-- ===== FACE GEOMETRY ===== -->
        <g class="hero-logo-face">
          <!-- path627: nose/eye (primary) -->
          <path class="hero-logo-face-facet" style="--facet-origin-x: 60%; --facet-origin-y: 35%" fill="var(--hero-logo-face-primary)" d="M 137.571,-192.006 L 146.549,-198.699 L 140.422,-207.16 H 152.021 V -168.003 H 131.619 Z" />
          <!-- path628: highlight A -->
          <path class="hero-logo-face-facet" style="--facet-origin-x: 25%; --facet-origin-y: 45%" fill="var(--hero-logo-face-highlight)" d="M 137.571,-192.006 L 131.618,-168.003 L 115.662,-215.473 Z" />
          <!-- path629: chin (primary) -->
          <path class="hero-logo-face-facet" style="--facet-origin-x: 45%; --facet-origin-y: 65%" fill="var(--hero-logo-face-primary)" d="M 131.619,-168.003 L 103.154,-196.768 L 115.662,-215.473 Z" />
          <!-- path630: highlight B -->
          <path class="hero-logo-face-facet" style="--facet-origin-x: 35%; --facet-origin-y: 55%" fill="var(--hero-logo-face-highlight)" d="M 115.662,-215.473 L 103.154,-196.768 V -232.276 Z" />
          <!-- path631: jaw/neck (primary) -->
          <path class="hero-logo-face-facet" style="--facet-origin-x: 45%; --facet-origin-y: 78%" fill="var(--hero-logo-face-primary)" d="M 103.154,-232.276 V -196.768 L 87.779,-230.032 L 87.183,-238.708 L 95.226,-250.549 Z" />
          <!-- path632: highlight C -->
          <path class="hero-logo-face-facet" style="--facet-origin-x: 20%; --facet-origin-y: 75%" fill="var(--hero-logo-face-highlight)" d="M 95.226,-250.549 L 87.183,-238.708 L 83.961,-285.648 L 87.623,-287.842 Z" />
          <!-- path633: neck base (accent) -->
          <path class="hero-logo-face-facet" style="--facet-origin-x: 45%; --facet-origin-y: 92%" fill="var(--hero-logo-face-accent)" d="M 98.110,-309.499 L 102.341,-317.447 L 112.420,-322.851 L 136.443,-317.508 L 139.640,-309.453 L 114.175,-315.238 Z" />
          <!-- path635: forehead (primary) -->
          <path class="hero-logo-face-facet" style="--facet-origin-x: 55%; --facet-origin-y: 25%" fill="var(--hero-logo-face-primary)" d="M 115.662,-215.473 L 109.408,-223.875 L 117.164,-237.152 L 142.005,-246.262 L 152.021,-240.798 V -232.277 H 151.170 L 147.694,-233.875 L 121.507,-230.032 Z" />
          <!-- path634: full profile (primary) -->
          <path class="hero-logo-face-facet" style="--facet-origin-x: 45%; --facet-origin-y: 50%" fill="var(--hero-logo-face-primary)" d="M 87.188,-311.458 L 87.623,-287.842 L 83.961,-285.648 L 80.593,-308.559 L 79.094,-322.133 L 87.584,-360.718 L 115.842,-387.998 L 149.090,-397.002 H 152.539 V -394.551 V -365.522 H 149.090 L 118.152,-376.059 L 95.023,-354.559 L 95.687,-330.914 Z" />
        </g>

        <!-- ===== SIGNATURE (RU/EN conditional) ===== -->
        <!-- EN signature paths: extract from hero_logo_en_dark_theme.svg path653–660 + g665 -->
        <!-- RU signature paths: extract from hero_logo_ru_dark_theme.svg g67 paths -->
        <g class="hero-logo-signature" fill="none" stroke="var(--hero-logo-text)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <template v-if="isRu">
            <!-- RU signature paths go here (from hero_logo_ru_dark_theme.svg) -->
            <path class="hero-logo-signature-path" d="..." />
            <!-- ... -->
          </template>
          <template v-else>
            <!-- EN signature paths go here (from hero_logo_en_dark_theme.svg) -->
            <path class="hero-logo-signature-path" d="..." />
            <!-- ... -->
          </template>
        </g>

        <!-- ===== TAGLINE (typing) ===== -->
        <text class="hero-logo-typing-text" x="50%" y="285" text-anchor="middle" font-size="12">
          <tspan class="hero-logo-typing-cursor">|</tspan>
        </text>
      </svg>
    </div>
  </ClientOnly>
</template>
```

**Design decisions in this component:**
- `aria-hidden="true"` — decorative, not semantic content
- `ClientOnly` — prevents SSR hydration mismatch (GSAP needs DOM)
- `prefers-reduced-motion` check — instant display when user prefers no motion
- `onBeforeUnmount` cleanup — kills timeline and removes event listeners
- The `v-if="isRu"` conditional switches signature paths at the template level (no runtime SVG swapping)

### TASK 6: Integrate into SectionHero.vue

**Modify:** `app/components/sections/SectionHero.vue`

Add the animated logo import and render it inside the hero section:

```vue
<script setup lang="ts">
// ... existing imports ...

// ADD: Import the animated logo molecule
// Nuxt auto-imports MoleculesHeroAnimatedLogo (no explicit import needed)
</script>

<template>
  <section id="home" class="section section-fullscreen section-hero section-hero--left">
    <!-- ADD: Animated origami logo (behind text, pointer-events none) -->
    <MoleculesHeroAnimatedLogo />

    <!-- Existing parallax (keep, but may want to disable when animated logo is active) -->
    <ClientOnly v-if="shouldRenderHeroParallax">
      <MoleculesHeroParallaxScene />
    </ClientOnly>

    <div class="container">
      <!-- ... existing title, subtitle, actions ... -->
    </div>
  </section>
</template>
```

**Consideration:** The animated logo and the existing parallax scene both occupy the hero background. They could coexist (logo anchored right, parallax as ambient backdrop) or be mutually exclusive. **Recommendation:** place the animated logo as the primary visual and conditionally disable the parallax scene when the logo is active. Add a feature flag to config.

### TASK 7: Add Feature Flag (Optional)

**Modify:** `project/puppet-master.config.ts`

Add to the `features` object:
```ts
features: {
  // ... existing ...
  heroAnimatedLogo: true,  // Enable GSAP animated origami logo in hero
}
```

**Modify:** `app/types/config.ts` — add `heroAnimatedLogo: boolean` to the Features interface.

Gate the logo rendering in `SectionHero.vue`:
```vue
<MoleculesHeroAnimatedLogo v-if="config.features.heroAnimatedLogo" />
```

### TASK 8: RTL Support

The face geometry faces **left** in the current SVGs. For RTL locales (Hebrew/Arabic), the face should face **right**. Add a CSS transform to flip:

```css
/* In hero-logo.css */
:dir(rtl) .hero-logo-animated svg {
  transform: scaleX(-1);
}
```

The typing effect direction and cursor placement should also flip. For now, the project only has `ru` and `en` (both LTR), so RTL is a deferred concern.

### TASK 9: Responsive Sizing

The logo SVG should scale responsively. Use `viewBox` for intrinsic sizing and control the container:

```css
/* In hero-logo.css, add responsive rules */
.hero-logo-animated svg {
  /* On desktop: logo occupies right 40% of hero */
  width: clamp(280px, 40vw, 500px);
  height: auto;
  position: absolute;
  right: 5%;
  top: 50%;
  transform: translateY(-50%);
}

/* On mobile: logo shrinks, moves to background behind title */
@media (max-width: 768px) {
  .hero-logo-animated svg {
    width: 60vw;
    right: 50%;
    transform: translate(50%, -50%);
    opacity: 0.15;  /* faded behind text */
  }
}
```

### TASK 10: Build & Validate

1. `npm run dev` — confirm no console errors
2. Verify the logo appears on page load
3. Verify the 3-phase animation plays in sequence:
   - Face facets fold in with stagger (~1.5s)
   - Signature draws with handwriting effect (~2.5s)
   - Tagline types out character by character (~1.5s)
   - Cursor blinks then fades
4. Toggle theme (light/dark) — confirm colors switch via CSS variables
5. Toggle locale (ru/en) — confirm different signature and tagline text
6. Move mouse over the logo — confirm subtle parallax displacement
7. Enable `prefers-reduced-motion` in dev tools — confirm instant display, no animations
8. Navigate away and back — confirm no memory leaks (check browser Performance/Memory tab)
9. `npm run build` — confirm production build succeeds

---

## Risk Factors

| Risk | Mitigation |
|------|-----------|
| Signature paths are filled outlines, not centerline strokes — DrawSVGPlugin traces the perimeter, not handwriting "spine" | For the thin cursive "Passions Conflict RUS" font, the perimeter trace is close enough. If quality is insufficient, export center-line strokes from Inkscape using `Path → Stroke to Path` reverse workflow or manually trace. |
| GSAP timeline conflicts with page transitions (`pageTransitions: 'zoom'`) | Wrap in `ClientOnly` and delay timeline start until after Nuxt page transition completes (use `nextTick` + small `setTimeout`). |
| Large inline SVG bloats the component file | Consider extracting the SVG `<template>` into a separate `.vue` file per language and importing them. |
| CSS `light-dark()` browser support | Supported in all modern browsers (Chrome 123+, Firefox 120+, Safari 17.5+). Acceptable for this project. Fallback: define `.light` / `.dark` class selectors in addition to `light-dark()`. |
| GSAP TextPlugin typing effect for Cyrillic "IT Консалтинг" — TextPlugin treats non-ASCII fine, but verify no encoding issues | Test both locales on mount. |
