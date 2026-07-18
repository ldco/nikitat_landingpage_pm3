# PM Coding Style Guide

Based on AGENTS.md 4 critical rules.

---

## Rule #1: Every Component Has class Prop + tailwind-merge

```svelte
<!-- Button.svelte -->
<script lang="ts">
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  type Size = 'sm' | 'md' | 'lg'
  type Variant = 'primary' | 'secondary' | 'outline' | 'ghost'

  interface Props {
    variant?: Variant
    size?: Size
    disabled?: boolean
    href?: string
    class?: string
    children?: import('svelte').Snippet
  }

  let { variant = 'primary', size = 'md', disabled = false, href, class: className = '', children }: Props = $props()

  const base = 'inline-flex items-center justify-center rounded-md font-medium transition-all duration-150'
  const sizes = { sm: 'px-4 py-1.5 text-xs', md: 'px-6 py-2.5 text-sm', lg: 'px-8 py-3 text-lg' }
  const variants = {
    primary: 'bg-pm-brand text-pm-white hover:bg-pm-brand-light',
    secondary: 'bg-pm-black text-pm-white hover:bg-pm-black/80',
    outline: 'border-2 border-pm-brand text-pm-brand hover:bg-pm-brand hover:text-pm-white',
    ghost: 'text-pm-muted hover:bg-gray-100'
  }

  const merged = twMerge(clsx(base, sizes[size], variants[variant], disabled && 'opacity-50 cursor-not-allowed', className))
</script>

{#if href}
  <a {href} class={merged}>{@render children?.()}</a>
{:else}
  <button {disabled} class={merged}>{@render children?.()}</button>
{/if}
```

**Result:** AI writes `<Button variant="primary" class="mt-4 w-full">` — no wrapper divs.

## Rule #2: Composition — NEVER Monolithic Sections

```svelte
<!-- ✅ Homepage — AI composes from atoms -->
<script lang="ts">
  import { getI18n } from '$lib/stores/i18n.svelte'
  import Section from '$lib/components/atoms/Section.svelte'
  import Container from '$lib/components/atoms/Container.svelte'
  import Heading from '$lib/components/atoms/Heading.svelte'
  import Text from '$lib/components/atoms/Text.svelte'
  import Grid from '$lib/components/atoms/Grid.svelte'
  import Card from '$lib/components/atoms/Card.svelte'
  import Button from '$lib/components/atoms/Button.svelte'

  const i18n = getI18n()
</script>

<!-- Hero -->
<Section padding="large" class="min-h-screen flex items-center">
  <Container>
    <Heading size="xl" class="mb-md text-center">{i18n.t('hero.title')}</Heading>
    <Text size="lg" class="mb-lg text-center max-w-2xl mx-auto">{i18n.t('hero.subtitle')}</Text>
    <div class="flex gap-4 justify-center">
      <Button variant="primary">{i18n.t('cta.primary')}</Button>
      <Button variant="outline">{i18n.t('cta.secondary')}</Button>
    </div>
  </Container>
</Section>

<!-- Focus cards -->
<Section padding="large" id="focus">
  <Container>
    <Heading size="lg" class="mb-xl text-center">{i18n.t('focus.title')}</Heading>
    <Grid cols="3">
      {#each items as item}
        <Card class="p-lg">
          <Heading size="sm">{item.title}</Heading>
          <Text size="sm">{item.description}</Text>
        </Card>
      {/each}
    </Grid>
  </Container>
</Section>
```

**Atomic composition library:**
```
<Section>      — padding: none | small | medium | large
<Container>    — max-width + horizontal padding
<Heading>      — size: xs | sm | md | lg | xl (maps to h1..h6)
<Text>         — size: sm | md | lg (paragraph)
<Grid>         — cols: 2 | 3 | 4, gap: sm | md | lg
<Card>         — padding, shadow, border, hover effects
<Badge>        — pill-shaped label, variant: default | outline
<Spinner>      — loading indicator, size: sm | md | lg
<EmptyState>   — title + description + illustration
```

## Rule #3: Strict Union Types Only

```svelte
// ✅ EVERY component uses union types
type Size = 'sm' | 'md' | 'lg'
type Variant = 'primary' | 'secondary' | 'outline' | 'ghost'
type Padding = 'none' | 'small' | 'medium' | 'large'
type Align = 'left' | 'center' | 'right'

// ❌ NEVER string or number for props
let { size = 'md' }: { size?: string } = $props()  // AI writes size="big"
```

## Rule #4: Isolate GSAP / Matter.js / Three.js

```svelte
<!-- FallingLetters.svelte — self-contained, no logic leaks -->
<script lang="ts">
  import Matter from 'matter-js'

  interface Props { enabled?: boolean }
  let { enabled = true }: Props = $props()

  let canvas: HTMLCanvasElement
  let engine: Matter.Engine | null = null
  let runner: Matter.Runner | null = null

  $effect(() => {
    if (!canvas || !enabled) return

    engine = Matter.Engine.create({ enableSleeping: true })
    runner = Matter.Runner.create()
    // ... setup walls, bodies ...

    return () => {
      if (runner) { Matter.Runner.stop(runner); runner = null }
      if (engine) { Matter.Engine.clear(engine); engine = null }
    }
  })
</script>

<canvas bind:this={canvas} class="fixed inset-0 pointer-events-none -z-10" />
```

## Svelte 5 Runes

```svelte
let count = $state(0)
let doubled = $derived(count * 2)
$effect(() => { return () => {} })
let { title }: Props = $props()
{@render children?.()}
onclick={handler}
```

## i18n

```svelte
<script lang="ts">
  import { getI18n } from '$lib/stores/i18n.svelte'
  const i18n = getI18n()
</script>
<h1>{i18n.t('hero.title')}</h1>
```

## API

```ts
import { jsonSuccess, apiError } from '$lib/server/utils/api'
export async function GET() { return jsonSuccess(data) }
export async function POST(e) { if (!body) apiError(400, 'msg'); ... }
```

## What NOT to Do

1. ❌ `any` — ever
2. ❌ `@ts-ignore` — fix the type
3. ❌ `!` non-null assertion
4. ❌ `$:` / `export let` / `<slot>` / `on:click`
5. ❌ Monolithic `<SectionHero>` with 10+ props
6. ❌ Missing `class` prop on any component (Rule #1)
7. ❌ `string` props where union is possible (Rule #3)
8. ❌ GSAP/Matter.js outside isolated component (Rule #4)
9. ❌ Hardcoded hex colors — use tokens
10. ❌ Wrapper divs — use `class` prop
