<script lang="ts">
  /**
   * SectionFocus — Focus/services section with cards
   * i18n: sections_services, nav_focus, common_more
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'

  let {
    class: className = ''
  }: {
    class?: string
  } = $props()

  const areas = [
    { title: 'UI/UX Design', desc: 'User-centered design with modern tools and frameworks.', icon: '🎨' },
    { title: 'Development', desc: 'Full-stack development with SvelteKit, Node.js, and more.', icon: '⚡' },
    { title: 'AI Integration', desc: 'AI-powered features and automation solutions.', icon: '🤖' },
    { title: 'Performance', desc: 'Optimized for speed, SEO, and Core Web Vitals.', icon: '🚀' },
    { title: 'Security', desc: 'Enterprise-grade security by architecture.', icon: '🔒' },
    { title: 'Support', desc: 'Dedicated support and maintenance.', icon: '💬' }
  ]
</script>

<section class={twMerge(clsx('py-20 md:py-28 bg-pm-bg-elevated', className))}>
  <div class="container-wide">
    <h2 class="text-3xl sm:text-4xl font-bold text-pm-text font-display text-center">
      {m.sections_services()}
    </h2>
    <div class="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each areas as area}
        <div class="p-6 rounded-xl bg-pm-bg border border-pm-border shadow-md hover:shadow-md-hover transition-shadow duration-300">
          <span class="text-3xl">{area.icon}</span>
          <h3 class="mt-4 text-lg font-bold text-pm-text">{area.title}</h3>
          <p class="mt-2 text-sm text-pm-text-muted">{area.desc}</p>
        </div>
      {/each}
    </div>
  </div>
</section>
