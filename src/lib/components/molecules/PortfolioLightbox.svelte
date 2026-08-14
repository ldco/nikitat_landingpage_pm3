<script lang="ts">
  /**
   * PortfolioLightbox — Image viewer with keyboard navigation and captions
   * Rule #1: class prop + twMerge
   *
   * IMPORTANT: This isolates keyboard/scroll event handling.
   * Cleanup in $effect return prevents memory leaks (Rule #4).
   *
   * @props {Array<{src: string; alt?: string; caption?: string}>} [images=[]] — lightbox image list
   * @props {number} [index=0] — active image index (bindable)
   * @props {boolean} [open=false] — lightbox visibility (bindable)
   * @props {string} [class] — additional CSS classes merged via twMerge
   *
   * @example
   * <PortfolioLightbox images={images} bind:index bind:open />
   */
  import IconX from '@tabler/icons-svelte/icons/x'
  import IconChevronLeft from '@tabler/icons-svelte/icons/chevron-left'
  import IconChevronRight from '@tabler/icons-svelte/icons/chevron-right'
  import { t } from '$lib/stores/content.svelte'
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
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onclick={close} role="dialog" aria-label={t('common.lightbox')} tabindex="-1">
    <!-- Close button -->
    <button class="absolute top-4 right-4 z-10 p-2 text-white/80 hover:text-white transition-colors" onclick={close} aria-label={t('common.close')}>
      <IconX class="size-6" />
    </button>

    <!-- Previous -->
    {#if images.length > 1}
      <button class="absolute left-4 z-10 p-2 text-white/80 hover:text-white transition-colors" onclick={prev} aria-label={t('common.previous')}>
        <IconChevronLeft class="size-8" />
      </button>
    {/if}

    <!-- Image -->
    <div class="max-w-[var(--lightbox-max-width)] max-h-[var(--lightbox-max-height)] flex flex-col items-center" onclick={(e) => e.stopPropagation()} role="presentation">
      <img src={current.src} alt={current.alt ?? ''} class="max-w-full max-h-[var(--lightbox-image-max-height)] object-contain rounded-lg" />

      {#if current.caption}
        <p class="mt-3 text-sm text-white/70 text-center max-w-lg">{current.caption}</p>
      {/if}

      {#if images.length > 1}
        <div class="mt-3 flex items-center gap-2">
          {#each images as img, i}
            <button class={clsx('w-2 h-2 rounded-full transition-colors', i === index ? 'bg-white' : 'bg-white/40')} onclick={() => index = i} aria-label={t('common.goToImage', { index: i + 1 })}></button>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Next -->
    {#if images.length > 1}
      <button class="absolute right-4 z-10 p-2 text-white/80 hover:text-white transition-colors" onclick={next} aria-label={t('common.next')}>
        <IconChevronRight class="size-8" />
      </button>
    {/if}
  </div>
{/if}
