<script lang="ts">
  /**
   * BrandbookFields — Brandbook-type metadata editor for the portfolio item modal
   *
   * Edits the PM v2 brandbook payload: pdfUrl and the pages array (url +
   * caption rows). Values are bound two-way to the parent's
   * `PortfolioItemFormMetadata` state and serialized by the shared adapter
   * (`serializeItemMetadata`). Controls use the canonical FormField primitive;
   * row actions use AddRowButton + IconButton.
   *
   * @props {string} pdfUrl — bindable brandbook PDF URL
   * @props {Array<{url,caption}>} pages — bindable page rows
   * @props {string} [class] — additional CSS classes
   *
   * @example
   * <BrandbookFields bind:pdfUrl={formMetadata.pdfUrl} bind:pages={formMetadata.pages} />
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
    pdfUrl = $bindable(''),
    pages = $bindable([] as Array<{ url: string; caption: string }>),
    class: className = ''
  }: {
    pdfUrl?: string
    pages?: Array<{ url: string; caption: string }>
    class?: string
  } = $props()

  const adminT = $derived(getAdminT($page.data))

  function addPage(): void {
    pages = [...pages, { url: '', caption: '' }]
  }
  function removePage(index: number): void {
    pages = pages.filter((_, i) => i !== index)
  }
</script>

<div class={twMerge(clsx('flex flex-col gap-4', className))}>
  <FormField
    name="field-item-pdf-url"
    label={adminT['admin.portfolioPdfUrl'] ?? t('admin.portfolioPdfUrl')}
    bind:value={pdfUrl}
    placeholder="https://..."
  />
  <div class="flex flex-col gap-2">
    <span class="text-sm font-medium text-pm-text">
      {adminT['admin.portfolioPages'] ?? t('admin.portfolioPages')}
    </span>
    {#each pages as pageRow, i (i)}
      <div class="flex flex-col gap-1.5 rounded-md border border-pm-border bg-pm-bg-sunken p-2">
        <div class="flex items-center gap-2">
          <FormField
            name={`page-url-${i}`}
            class="flex-1"
            bind:value={pageRow.url}
            placeholder="https://..."
            ariaLabel={adminT['admin.portfolioImageUrl'] ?? t('admin.portfolioImageUrl')}
          />
          <IconButton
            variant="danger"
            ariaLabel={adminT['admin.removeRow'] ?? t('admin.removeRow')}
            onclick={() => removePage(i)}
          >
            <IconTrash class="size-4" />
          </IconButton>
        </div>
        <FormField
          name={`page-caption-${i}`}
          bind:value={pageRow.caption}
          placeholder={adminT['admin.caption'] ?? t('admin.caption')}
        />
      </div>
    {/each}
    <AddRowButton onclick={addPage}>
      {adminT['admin.addRow'] ?? t('admin.addRow')}
    </AddRowButton>
  </div>
</div>
