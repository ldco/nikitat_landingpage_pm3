<script lang="ts">
  /**
   * HeroParallaxScene — Project-specific parallax layers for hero section
   * PM v2: HeroParallaxScene.vue (215 lines) + hero-parallax.css (207 lines)
   *
   * Renders parallax layers behind hero content when FEATURES.heroParallax is true.
   * Layers are loaded from /images/hero/layers/ (project-specific assets).
   */
  let layers: string[] = $state([])

  async function checkLayer(key: string): Promise<boolean> {
    try {
      const res = await fetch(`/images/hero/layers/${key}.svg`, { method: 'HEAD' })
      return res.ok
    } catch { return false }
  }

  $effect(() => {
    Promise.all(['clouds/far', 'clouds/mid', 'clouds/front'].map(k => checkLayer(k)))
      .then(results => { layers = ['clouds/far', 'clouds/mid', 'clouds/front'].filter((_, i) => results[i]) })
  })

  // Map layer suffix to Tailwind classes (matches app-nuxt hero-parallax.css)
  function layerClass(layer: string): string {
    const suffix = layer.split('/')[1] ?? layer
    const map: Record<string, string> = {
      far: 'opacity-30 blur-xs',
      mid: 'opacity-60',
      front: 'opacity-90'
    }
    return map[suffix] ?? 'opacity-60'
  }
</script>

{#if layers.length > 0}
  <div class="absolute inset-0 overflow-hidden z-10 pointer-events-none select-none" aria-hidden="true">
    {#each layers as layer}
      <div class={layerClass(layer)}>
        <img src="/images/hero/layers/{layer}.svg" alt="" loading="lazy" decoding="async" fetchpriority="low" />
      </div>
    {/each}
  </div>
{/if}
