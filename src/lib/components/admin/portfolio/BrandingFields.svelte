<script lang="ts">
  /**
   * BrandingFields — Branding-type metadata editor for the portfolio item modal
   *
   * Edits the PM v2 branding payload: clientUrl, tags (comma list) and the
   * sections array (title + text rows). Values are bound two-way to the
   * parent's `PortfolioItemFormMetadata` state and serialized by the shared
   * adapter (`serializeItemMetadata`). Controls use the canonical FormField
   * primitive; row actions use AddRowButton + IconButton.
   *
   * @props {string} clientUrl — bindable client website URL
   * @props {string} tags — bindable comma-separated tag list
   * @props {Array<{title,text}>} sections — bindable section rows
   * @props {string} [class] — additional CSS classes
   *
   * @example
   * <BrandingFields bind:clientUrl={formMetadata.clientUrl} bind:tags={formMetadata.tags} bind:sections={formMetadata.sections} />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { page } from '$app/stores'
  import { t } from '$lib/stores/content.svelte'
  import { getAdminT } from '$lib/utils/admin-translations'
  import FormField from '$lib/components/atoms/FormField.svelte'
  import AddRowButton from '$lib/components/atoms/AddRowButton.svelte'
  import IconButton from '$lib/components/atoms/IconButton.svelte'
  import IconTrash from '@tabler/icons-svelte/icons/trash'

  let {
    clientUrl = $bindable(''),
    tags = $bindable(''),
    sections = $bindable([] as Array<{ title: string; text: string }>),
    class: className = ''
  }: {
    clientUrl?: string
    tags?: string
    sections?: Array<{ title: string; text: string }>
    class?: string
  } = $props()

  const adminT = $derived(getAdminT($page.data))

  function addSection(): void {
    sections = [...sections, { title: '', text: '' }]
  }
  function removeSection(index: number): void {
    sections = sections.filter((_, i) => i !== index)
  }
</script>

<div class={twMerge(clsx('flex flex-col gap-4', className))}>
  <FormField
    name="field-item-client-url"
    label={adminT['admin.portfolioClientUrl'] ?? t('admin.portfolioClientUrl')}
    bind:value={clientUrl}
    placeholder="https://..."
  />
  <FormField
    name="field-item-tags"
    label={adminT['admin.tags'] ?? t('admin.tags')}
    bind:value={tags}
  />
  <div class="flex flex-col gap-2">
    <span class="text-sm font-medium text-pm-text">
      {adminT['admin.portfolioSections'] ?? t('admin.portfolioSections')}
    </span>
    {#each sections as section, i (i)}
      <div class="flex flex-col gap-1.5 rounded-md border border-pm-border bg-pm-bg-sunken p-2">
        <div class="flex items-center gap-2">
          <FormField
            name={`section-title-${i}`}
            class="flex-1"
            bind:value={section.title}
            placeholder={adminT['admin.portfolioSectionTitle'] ?? t('admin.portfolioSectionTitle')}
          />
          <IconButton
            variant="danger"
            ariaLabel={adminT['admin.removeRow'] ?? t('admin.removeRow')}
            onclick={() => removeSection(i)}
          >
            <IconTrash class="size-4" />
          </IconButton>
        </div>
        <FormField
          name={`section-text-${i}`}
          type="textarea"
          rows={2}
          bind:value={section.text}
          placeholder={adminT['admin.portfolioSectionText'] ?? t('admin.portfolioSectionText')}
        />
      </div>
    {/each}
    <AddRowButton onclick={addSection}>
      {adminT['admin.addRow'] ?? t('admin.addRow')}
    </AddRowButton>
  </div>
</div>
