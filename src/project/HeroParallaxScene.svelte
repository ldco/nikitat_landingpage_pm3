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
</script>

{#if layers.length > 0}
  <div class="hero-parallax-scene pointer-events-none select-none" aria-hidden="true">
    {#each layers as layer}
      <div class="hero-parallax-scene__cloud hero-parallax-scene__cloud--{layer.split('/')[1] || layer}">
        <img src="/images/hero/layers/{layer}.svg" alt="" loading="lazy" decoding="async" fetchpriority="low" />
      </div>
    {/each}
  </div>
{/if}

<style>
  .hero-parallax-scene {
    position: absolute; inset: 0; overflow: hidden; z-index: 1;
    pointer-events: none; user-select: none;
  }
  .hero-parallax-scene__cloud {
    position: absolute; will-change: transform;
    animation: parallaxFloat 6s ease-in-out infinite;
  }
  .hero-parallax-scene__cloud--far { opacity: 0.3; filter: blur(1px); }
  .hero-parallax-scene__cloud--mid { opacity: 0.6; }
  .hero-parallax-scene__cloud--front { opacity: 0.9; }
  @keyframes parallaxFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
</style>
