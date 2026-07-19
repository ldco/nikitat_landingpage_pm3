<script lang="ts">
  import '../app.css'
  import { page } from '$app/stores'
  import { fade, slide } from 'svelte/transition'
  import { FEATURES } from '$lib/config/site'
  import { scrollSpy } from '$lib/actions/scrollSpy'
  import TheHeader from '$lib/components/complex/TheHeader.svelte'
  import TheFooter from '$lib/components/complex/TheFooter.svelte'
  import BackToTop from '$lib/components/atoms/BackToTop.svelte'
  import CookieConsent from '$lib/components/complex/CookieConsent.svelte'
  import ToastContainer from '$lib/components/complex/ToastContainer.svelte'

  let { children }: { children?: import('svelte').Snippet } = $props()
</script>

<TheHeader />
<main class="min-h-screen pt-16" use:scrollSpy>
  {#key $page.url.pathname}
    <div transition:fade={{ duration: 200 }}>
      {@render children?.()}
    </div>
  {/key}
</main>
<TheFooter />
<BackToTop />
<CookieConsent />
<ToastContainer />
