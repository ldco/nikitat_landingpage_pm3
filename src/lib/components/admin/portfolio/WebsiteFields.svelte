<script lang="ts">
  /**
   * WebsiteFields — Website-type metadata editor for the portfolio item modal
   *
   * Edits the PM v2 website payload: liveUrl, technologies (comma list), the
   * screenshots array (url + caption rows) and the long-form body `content`
   * field (the website explanation text rendered by the public WebsiteViewer —
   * lines starting with `### ` render as headings). The body textarea is a
   * NAMED form field (`name="content"`) so it persists through the shared
   * content field accepted by the create/update actions. Values are bound
   * two-way to the parent's `PortfolioItemFormMetadata` state and serialized
   * by the shared adapter (`serializeItemMetadata`). Controls use the
   * canonical FormField primitive; row actions use AddRowButton + IconButton.
   *
   * @props {string} liveUrl — bindable live site URL
   * @props {string} technologies — bindable comma-separated list
   * @props {Array<{url,caption}>} screenshots — bindable screenshot rows
   * @props {string} content — bindable long-form website body
   * @props {string} [class] — additional CSS classes
   *
   * @example
   * <WebsiteFields bind:liveUrl={formMetadata.liveUrl} bind:technologies={formMetadata.technologies} bind:screenshots={formMetadata.screenshots} bind:content={formContent} />
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
    liveUrl = $bindable(''),
    technologies = $bindable(''),
    screenshots = $bindable([] as Array<{ url: string; caption: string }>),
    content = $bindable(''),
    class: className = ''
  }: {
    liveUrl?: string
    technologies?: string
    screenshots?: Array<{ url: string; caption: string }>
    content?: string
    class?: string
  } = $props()

  const adminT = $derived(getAdminT($page.data))

  function addScreenshot(): void {
    screenshots = [...screenshots, { url: '', caption: '' }]
  }
  function removeScreenshot(index: number): void {
    screenshots = screenshots.filter((_, i) => i !== index)
  }
</script>

<div class={twMerge(clsx('flex flex-col gap-4', className))}>
  <FormField
    name="field-item-live-url"
    label={adminT['admin.portfolioLiveUrl'] ?? t('admin.portfolioLiveUrl')}
    bind:value={liveUrl}
    placeholder="https://..."
  />
  <FormField
    name="field-item-technologies"
    label={adminT['admin.portfolioTechnologies'] ?? t('admin.portfolioTechnologies')}
    bind:value={technologies}
  />
  <div class="flex flex-col gap-2">
    <span class="text-sm font-medium text-pm-text">
      {adminT['admin.portfolioScreenshots'] ?? t('admin.portfolioScreenshots')}
    </span>
    {#each screenshots as shot, i (i)}
      <div class="flex flex-col gap-1.5 rounded-md border border-pm-border bg-pm-bg-sunken p-2">
        <div class="flex items-center gap-2">
          <FormField
            name={`screenshot-url-${i}`}
            class="flex-1"
            bind:value={shot.url}
            placeholder="https://..."
            ariaLabel={adminT['admin.portfolioImageUrl'] ?? t('admin.portfolioImageUrl')}
          />
          <IconButton
            variant="danger"
            ariaLabel={adminT['admin.removeRow'] ?? t('admin.removeRow')}
            onclick={() => removeScreenshot(i)}
          >
            <IconTrash class="size-4" />
          </IconButton>
        </div>
        <FormField
          name={`screenshot-caption-${i}`}
          bind:value={shot.caption}
          placeholder={adminT['admin.caption'] ?? t('admin.caption')}
        />
      </div>
    {/each}
    <AddRowButton onclick={addScreenshot}>
      {adminT['admin.addRow'] ?? t('admin.addRow')}
    </AddRowButton>
  </div>

  <FormField
    name="content"
    type="textarea"
    rows={8}
    label={adminT['admin.portfolioContent'] ?? t('admin.portfolioContent')}
    bind:value={content}
  />
</div>
