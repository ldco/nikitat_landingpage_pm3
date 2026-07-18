<script lang="ts">
  /**
   * PortfolioLightbox — Image viewer with keyboard navigation and captions
   * Rule #1: class prop + twMerge
   *
   * IMPORTANT: This isolates keyboard/scroll event handling.
   * Cleanup in $effect return prevents memory leaks (Rule #4).
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  let {
    images = [] as Array<{ src: string; alt?: string; caption?: string }>,
    index = $bindable(0),
    open = $bindable(false),
    class: className = ''
  }: {
    images?: Array<{ src: string; alt?: string; caption?: string }>
    index?: number
    open?: boolean
    class?: string
  } = $props()

  const current = $derived(images[index])

  function prev() {
    index = index > 0 ? index - 1 : images.length - 1
  }

  function next() {
    index = index < images.length - 1 ? index + 1 : 0
  }

  function close() {
    open = false
  }

  // Keyboard navigation
  $effect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  })
</script>

{#if open && current}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onclick={close} role="dialog" aria-label="Image lightbox">
    <!-- Close button -->
    <button class="absolute top-4 right-4 z-10 p-2 text-white/80 hover:text-white transition-colors" onclick={close} aria-label="Close">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
    </button>

    <!-- Previous -->
    {#if images.length > 1}
      <button class="absolute left-4 z-10 p-2 text-white/80 hover:text-white transition-colors" onclick={prev} aria-label="Previous image">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6" /></svg>
      </button>
    {/if}

    <!-- Image -->
    <div class="max-w-[90vw] max-h-[85vh] flex flex-col items-center" onclick={(e) => e.stopPropagation()}>
      <img src={current.src} alt={current.alt ?? ''} class="max-w-full max-h-[80vh] object-contain rounded-lg" />

      {#if current.caption}
        <p class="mt-3 text-sm text-white/70 text-center max-w-lg">{current.caption}</p>
      {/if}

      {#if images.length > 1}
        <div class="mt-3 flex items-center gap-2">
          {#each images as img, i}
            <button class={clsx('w-2 h-2 rounded-full transition-colors', i === index ? 'bg-white' : 'bg-white/40')} onclick={() => index = i} aria-label={`Go to image ${i + 1}`} />
          {/each}
        </div>
      {/if}
    </div>

    <!-- Next -->
    {#if images.length > 1}
      <button class="absolute right-4 z-10 p-2 text-white/80 hover:text-white transition-colors" onclick={next} aria-label="Next image">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6" /></svg>
      </button>
    {/if}
  </div>
{/if}
