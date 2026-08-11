<script lang="ts">
  /**
   * MarkdownEditor — textarea with live preview toggle
   *
   * Used in admin legal page for document editing and blog content editing.
   *
   * @props {string} [content=''] — raw markdown content (one-way binding)
   * @props {string} [previewHtml=''] — rendered HTML for preview mode
   * @props {string} [label=''] — field label (i18n-resolved)
   * @props {string} [editLabel=''] — edit mode toggle label
   * @props {string} [previewLabel=''] — preview mode toggle label
   * @props {number} [rows=12] — textarea rows
   * @props {string} [class] — additional classes
   * @props {(value: string) => void} [onchange] — called when content changes
   *
   * @example
   * <MarkdownEditor content={doc.markdown} onchange={(v) => doc.markdown = v}
   *   previewHtml={renderLegalMarkdown(doc.markdown)}
   *   label={t('legal.privacyPolicy')} editLabel={t('admin.legalEditMode')}
   *   previewLabel={t('admin.legalPreviewMode')} />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import IconEye from '@tabler/icons-svelte/icons/eye'
  import IconPencil from '@tabler/icons-svelte/icons/pencil'

  let {
    content = '',
    previewHtml = '',
    label = '',
    editLabel = '',
    previewLabel = '',
    rows = 12,
    class: className = '',
    onchange
  }: {
    content?: string
    previewHtml?: string
    label?: string
    editLabel?: string
    previewLabel?: string
    rows?: number
    class?: string
    onchange?: (value: string) => void
  } = $props()

  let preview = $state(false)

  function handleInput(e: Event) {
    const target = e.currentTarget as HTMLTextAreaElement
    onchange?.(target.value)
  }
</script>

<div class={twMerge(clsx('flex flex-col gap-2', className))}>
  {#if label}
    <div class="flex items-center justify-between">
      <label class="text-sm font-medium text-pm-text">{label}</label>
      <button type="button" onclick={() => preview = !preview}
        class="inline-flex items-center gap-1 text-xs text-pm-text-muted hover:text-pm-brand transition-colors">
        {#if preview}
          <IconPencil class="size-3.5" />
          {editLabel}
        {:else}
          <IconEye class="size-3.5" />
          {previewLabel}
        {/if}
      </button>
    </div>
  {/if}

  {#if preview}
    <div class="min-h-72 px-4 py-3 rounded-md border border-pm-border bg-pm-bg prose prose-sm max-w-none prose-headings:text-pm-text prose-p:text-pm-text-secondary">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -- parent sanitizes HTML before passing it -->
      {@html previewHtml}
    </div>
  {:else}
    <textarea
      value={content}
      oninput={handleInput}
      rows={rows}
      class="w-full min-h-72 px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text font-mono focus:outline-none focus:border-pm-brand focus:ring-2 focus:ring-pm-focus-ring resize-y"
    ></textarea>
  {/if}
</div>
