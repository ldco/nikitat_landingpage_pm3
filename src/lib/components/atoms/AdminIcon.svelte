<script lang="ts">
  /**
   * AdminIcon — Admin nav icon by section id
   * Replaces dynamic <svelte:component> with component-to-id mapping.
   *
   * Rule #1: class prop + twMerge — wraps icon component with class
   */
  import IconHome from '@tabler/icons-svelte/icons/home'
  import IconUsers from '@tabler/icons-svelte/icons/users'
  import IconSettings from '@tabler/icons-svelte/icons/settings'
  import IconLanguage from '@tabler/icons-svelte/icons/language'
  import IconPhoto from '@tabler/icons-svelte/icons/photo'
  import IconArticle from '@tabler/icons-svelte/icons/article'
  import IconUsersGroup from '@tabler/icons-svelte/icons/users-group'
  import IconQuote from '@tabler/icons-svelte/icons/quote'
  import IconHelpCircle from '@tabler/icons-svelte/icons/help-circle'
  import IconBuilding from '@tabler/icons-svelte/icons/building'
  import IconCreditCard from '@tabler/icons-svelte/icons/credit-card'
  import IconSparkles from '@tabler/icons-svelte/icons/sparkles'
  import IconMail from '@tabler/icons-svelte/icons/mail'
  import IconClipboardList from '@tabler/icons-svelte/icons/clipboard-list'
  import IconActivity from '@tabler/icons-svelte/icons/activity'
  import IconShieldCheck from '@tabler/icons-svelte/icons/shield-check'
  import IconSettings2 from '@tabler/icons-svelte/icons/settings'

  let {
    id = 'dashboard',
    class: className = ''
  }: {
    id?: string
    class?: string
  } = $props()
</script>

{#if id === 'dashboard'}
  <IconHome class={className} />
{:else if id === 'users'}
  <IconUsers class={className} />
{:else if id === 'roles'}
  <IconShieldCheck class={className} />
{:else if id === 'translations'}
  <IconLanguage class={className} />
{:else if id === 'settings'}
  <IconSettings class={className} />
{:else if id === 'portfolios'}
  <IconPhoto class={className} />
{:else if id === 'blog'}
  <IconArticle class={className} />
{:else if id === 'team'}
  <IconUsersGroup class={className} />
{:else if id === 'testimonials'}
  <IconQuote class={className} />
{:else if id === 'faq'}
  <IconHelpCircle class={className} />
{:else if id === 'clients'}
  <IconBuilding class={className} />
{:else if id === 'pricing'}
  <IconCreditCard class={className} />
{:else if id === 'features'}
  <IconSparkles class={className} />
{:else if id === 'contacts'}
  <IconMail class={className} />
{:else if id === 'audit'}
  <IconClipboardList class={className} />
{:else if id === 'health'}
  <IconActivity class={className} />
{:else}
  <IconSettings2 class={className} />
{/if}
