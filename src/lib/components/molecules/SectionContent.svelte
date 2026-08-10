<script lang="ts">
  /**
   * SectionContent — Standard inner content wrapper for sections
   *
   * PM3 framework primitive. Standardizes the pattern every section uses:
   *   <div class="px-[var(--px-container)] w-full max-w-[var(--max-w-container)] mx-auto">
   *
   * Composes the Container atom (width + fluid padding). Scroll-reveal is
   * owned by the Section shell (applied to the <section> root) to avoid
   * double animations on the same viewport entry.
   *
   * @props width — container width: 'default' | 'narrow' | 'wide' | 'prose' | 'content' | 'full' | 'bleed'
   * @props class — merged Tailwind classes
   * @example <SectionContent><SectionHeading title={title} align="center" /><p>body</p></SectionContent>
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import Container from '$lib/components/atoms/Container.svelte'

  type Width = 'default' | 'narrow' | 'wide' | 'prose' | 'content' | 'full' | 'bleed'

  let {
    width,
    class: className = '',
    children
  }: {
    width?: Width
    class?: string
    children?: import('svelte').Snippet
  } = $props()
</script>

<Container {width} class={twMerge(clsx(className))}>
  {@render children?.()}
</Container>
