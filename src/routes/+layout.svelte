<script lang="ts">
  /**
   * Root Layout — Wraps all pages with header, footer, and global UI
   */
  import '../app.css'
  import TheHeader from '$lib/components/complex/TheHeader.svelte'
  import TheFooter from '$lib/components/complex/TheFooter.svelte'
  import BackToTop from '$lib/components/atoms/BackToTop.svelte'
  import CookieConsent from '$lib/components/complex/CookieConsent.svelte'
  import ToastContainer from '$lib/components/complex/ToastContainer.svelte'

  let { children }: { children?: import('svelte').Snippet } = $props()
</script>

<TheHeader />
<main class="min-h-screen pt-16">
  {@render children?.()}
</main>
<TheFooter />
<BackToTop />
<CookieConsent />
<ToastContainer />
