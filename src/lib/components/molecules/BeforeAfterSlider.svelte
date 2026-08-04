<script lang="ts">
  /**
   * BeforeAfterSlider — Draggable before/after image comparison
   *
   * Ported from PM v2 MoleculesBeforeAfterSlider.vue (app-nuxt) with
   * styling from ui/content/before-after-slider.css + runtime/section-about.css.
   * The "after" image is always visible; the "before" image is revealed from
   * the left via clip-path inset, controlled by a draggable handle.
   *
   * Accessible: role="slider" with arrow-key support (in addition to pointer drag).
   *
   * @props beforeSrc — path to the "before" image
   * @props afterSrc — path to the "after" image
   * @props initial — initial handle position 0-100 (default 100)
   * @props width — intrinsic img width (default 800)
   * @props height — intrinsic img height (default 800)
   * @props class — merged Tailwind classes
   * @example <BeforeAfterSlider beforeSrc="/images/about/2_r.png" afterSrc="/images/about/2.png" initial={0} />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'
  import IconArrowLeft from '@tabler/icons-svelte/icons/arrow-left'
  import IconArrowRight from '@tabler/icons-svelte/icons/arrow-right'

  let {
    beforeSrc,
    afterSrc,
    initial = 100,
    width = 800,
    height = 800,
    class: className = ''
  }: {
    beforeSrc: string
    afterSrc: string
    initial?: number
    width?: number
    height?: number
    class?: string
  } = $props()

  let container = $state<HTMLElement | null>(null)
  let position = $state<number>(0)
  let dragging = $state(false)

  // Cached layout rect (unchanged mid-drag) + rAF-coalesced pointer updates:
  // avoids a getBoundingClientRect() + two style writes per pointer event.
  let dragRect: DOMRect | null = null
  let pendingX = 0
  let rafPending = false

  // Seed + follow prop changes (runs before paint, keeps position in sync with `initial`)
  $effect.pre(() => {
    position = initial
  })

  function clamp(v: number) {
    return Math.max(0, Math.min(100, v))
  }

  function applyX(clientX: number) {
    if (!container || !dragRect) return
    position = clamp(((clientX - dragRect.left) / dragRect.width) * 100)
  }

  function onPointerDown(e: PointerEvent) {
    dragging = true
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    dragRect = container?.getBoundingClientRect() ?? null
    applyX(e.clientX)
  }
  function onPointerMove(e: PointerEvent) {
    if (!dragging || rafPending) return
    pendingX = e.clientX
    rafPending = true
    window.requestAnimationFrame(() => {
      rafPending = false
      applyX(pendingX)
    })
  }
  function onPointerUp() {
    dragging = false
  }
  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft') {
      position = clamp(position - 2)
      e.preventDefault()
    } else if (e.key === 'ArrowRight') {
      position = clamp(position + 2)
      e.preventDefault()
    }
  }
</script>

<div
  bind:this={container}
  class={twMerge(clsx(
    'ba-slider relative w-full h-full',
    'cursor-ew-resize select-none touch-none',
    className
  ))}
  role="slider"
  tabindex="0"
  aria-label={m.common_beforeAfter()}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-valuenow={Math.round(position)}
  onpointerdown={onPointerDown}
  onpointermove={onPointerMove}
  onpointerup={onPointerUp}
  onpointerleave={onPointerUp}
  onkeydown={onKeyDown}
>
  {#if afterSrc}
    <img src={afterSrc} alt="" class="ba-slider__after absolute inset-0 w-full h-full object-cover z-0" {width} {height} />
  {/if}

  <div class="ba-slider__before-clip absolute inset-0 z-10" style={`clip-path: inset(0 ${100 - position}% 0 0)`}>
    {#if beforeSrc}
      <img src={beforeSrc} alt="" class="ba-slider__before absolute inset-0 w-full h-full object-cover z-10" {width} {height} />
    {/if}
  </div>

  <!-- Handle: PM v2 section-about overrides → black line + black grip, on-brand arrows -->
  <div class="ba-slider__handle absolute inset-y-0 z-30" style={`left: ${position}%`}>
    <div class="ba-slider__line absolute inset-y-0 w-[2px] -translate-x-1/2 bg-pm-black shadow-[0_0_4px_rgba(0,0,0,0.3)]"></div>
    <div class="ba-slider__grip absolute top-1/2 -translate-x-1/2 -translate-y-1/2 size-9 rounded-full bg-pm-black border-2 border-pm-black flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.12)]">
      <IconArrowLeft class="size-3.5 text-pm-white" />
      <IconArrowRight class="size-3.5 text-pm-white" />
    </div>
  </div>
</div>
