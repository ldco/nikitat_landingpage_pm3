<script lang="ts">
  /**
   * CaseStudyFields — Case-study metadata editor for the portfolio item modal
   *
   * Edits the PM v2 case-study payload: tags (comma list) and the rich body
   * `content` field (lines starting with `### ` render as headings in the
   * public CaseStudyViewer). The content textarea is a NAMED form field
   * (`name="content"`) so it persists through the create/update actions.
   * Controls use the canonical FormField primitive.
   *
   * @props {string} tags — bindable comma-separated tag list
   * @props {string} content — bindable case-study body
   * @props {string} [class] — additional CSS classes
   *
   * @example
   * <CaseStudyFields bind:tags={formMetadata.tags} bind:content={formContent} />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { page } from '$app/stores'
  import { t } from '$lib/stores/content.svelte'
  import { getAdminT } from '$lib/utils/admin-translations'
  import FormField from '$lib/components/atoms/FormField.svelte'

  let {
    tags = $bindable(''),
    class: className = ''
  }: {
    tags?: string
    class?: string
  } = $props()

  const adminT = $derived(getAdminT($page.data))
</script>

<div class={twMerge(clsx('flex flex-col gap-4', className))}>
  <FormField
    name="field-item-cs-tags"
    label={adminT['admin.tags'] ?? t('admin.tags')}
    bind:value={tags}
  /></div>
