<script lang="ts">
  /**
   * LegalInfo — Config-driven copyright + legal/juridical info (PM v2 LegalInfo.vue parity)
   *
   * All on one line: © 2025 Company. All rights reserved · ИНН: xxx · ОГРН: xxx · ...
   * Only shows items that have values in database.
   *
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { t } from '$lib/stores/content.svelte'
  import { useSettings } from '$lib/stores/settings.svelte'

  let {
    class: className = ''
  }: {
    class?: string
  } = $props()

  const settings = useSettings()
  const currentYear = new Date().getFullYear()

  const companyName = $derived(
    settings.get('legal.companyName') ||
    settings.get('legal.companyLegalName') ||
    settings.get('seo.title') ||
    'Puppet Master'
  )

  interface LegalItem {
    label: string
    value: string
    href?: string
  }

  const legalDetails = $derived.by(() => {
    const items: LegalItem[] = []
    const inn = settings.get('legal.inn')
    const kpp = settings.get('legal.kpp')
    const ogrn = settings.get('legal.ogrn')
    const address = settings.get('legal.address')
    const email = settings.get('legal.email')

    if (inn) items.push({ label: t('legal.fields.inn'), value: inn })
    if (kpp) items.push({ label: t('legal.fields.kpp'), value: kpp })
    if (ogrn) items.push({ label: t('legal.fields.ogrn'), value: ogrn })
    if (address) items.push({ label: t('legal.fields.address'), value: address })
    if (email) items.push({ label: t('legal.fields.email'), value: email, href: `mailto:${email}` })

    return items
  })
</script>

<div class={twMerge(clsx('legal-row flex flex-wrap items-center gap-x-2 gap-y-1', className))}>
  <span>&copy; {currentYear} {companyName}. {t('footer.rights')}</span>
  {#each legalDetails as item (item.label)}
    <span class="legal-sep text-pm-text-muted">·</span>
    <span>
      {item.label}:
      {#if item.href}
        <a href={item.href} class="legal-link underline underline-offset-2 hover:text-pm-text transition-colors">{item.value}</a>
      {:else}
        {item.value}
      {/if}
    </span>
  {/each}
</div>
