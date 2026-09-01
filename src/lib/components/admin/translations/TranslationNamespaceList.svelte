<script lang="ts">
  /**
   * TranslationNamespaceList — namespace accordion + key/value table for the
   * admin translations editor.
   *
   * Owns the per-namespace accordion open/close state. The state is scoped by
   * `contextKey` (e.g. `${section}:${locale}`), so switching section/locale
   * starts every group collapsed; when `forceOpen` is set (a search is active)
   * every group renders expanded.
   *
   * @props {TranslationGroup[]} groups — sorted namespace groups to render
   * @props {string} contextKey — accordion-state scope (e.g. `${section}:${locale}`)
   * @props {boolean} [forceOpen=false] — render every group expanded
   * @props {(item: TranslationRow) => void} onEdit — edit callback (value cell)
   * @props {(item: TranslationRow) => void} onDelete — delete callback (trash button)
   * @props {string} [class] — additional CSS classes merged via twMerge
   *
   * @example
   * <TranslationNamespaceList groups={groups} contextKey={`${section}:${locale}`}
   *   forceOpen={searchQuery.trim().length > 0} {onEdit} {onDelete} />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { page } from '$app/stores'
  import { t } from '$lib/stores/content.svelte'
  import { getAdminT } from '$lib/utils/admin-translations'
  import IconChevronDown from '@tabler/icons-svelte/icons/chevron-down'
  import IconPencil from '@tabler/icons-svelte/icons/pencil'
  import IconTrash from '@tabler/icons-svelte/icons/trash'
  import Card from '$lib/components/atoms/Card.svelte'
  import IconButton from '$lib/components/atoms/IconButton.svelte'
  import AdminRowActions from '$lib/components/atoms/AdminRowActions.svelte'
  import type { TranslationRow } from '$lib/utils/translations-editor'

  export interface TranslationGroup {
    namespace: string
    items: TranslationRow[]
  }

  let {
    groups,
    contextKey,
    forceOpen = false,
    onEdit,
    onDelete,
    class: className = ''
  }: {
    groups: TranslationGroup[]
    contextKey: string
    forceOpen?: boolean
    onEdit: (item: TranslationRow) => void
    onDelete: (item: TranslationRow) => void
    class?: string
  } = $props()

  const adminT = $derived(getAdminT($page.data))
  const keyLabel = $derived(adminT['admin.translationKey'] ?? t('admin.translationKey'))
  const valueLabel = $derived(adminT['admin.translationValue'] ?? t('admin.translationValue'))

  let openGroups = $state<Set<string>>(new Set())

  function groupKey(group: TranslationGroup): string {
    return `${contextKey}:${group.namespace}`
  }

  function isGroupOpen(group: TranslationGroup): boolean {
    return forceOpen || openGroups.has(groupKey(group))
  }

  function toggleGroup(group: TranslationGroup): void {
    const key = groupKey(group)
    const next = new Set(openGroups)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    openGroups = next
  }
</script>

<div class={twMerge(clsx('flex flex-col gap-4', className))}>
  {#each groups as group (group.namespace)}
    <Card padding="none">
      <button
        type="button"
        class="w-full flex items-center justify-between gap-3 px-4 py-4 text-start bg-transparent border-0 cursor-pointer hover:bg-pm-bg-sunken transition-colors"
        aria-expanded={isGroupOpen(group)}
        onclick={() => toggleGroup(group)}
      >
        <span class="inline-flex items-center gap-2 min-w-0 font-semibold">
          <IconChevronDown
            class={clsx(
              'size-4 text-pm-text-muted shrink-0 transition-transform',
              !isGroupOpen(group) && '-rotate-90'
            )}
          />
          <span class="text-base text-pm-text">{group.namespace}</span>
        </span>
        <span
          class="inline-flex items-center justify-center min-w-8 px-2 py-1 rounded-full bg-pm-bg-sunken text-xs font-medium text-pm-text-muted"
        >
          {group.items.length}
        </span>
      </button>

      {#if isGroupOpen(group)}
        <div class="overflow-x-auto border-t border-pm-border">
          <table class="w-full border-collapse text-sm">
            <thead class="hidden sm:table-header-group bg-pm-bg-sunken">
              <tr>
                <th
                  class="px-5 py-3 text-start font-medium text-pm-text-muted text-sm whitespace-nowrap w-[var(--width-key-column)]"
                >
                  {keyLabel}
                </th>
                <th
                  class="px-5 py-3 text-start font-medium text-pm-text-muted text-sm whitespace-nowrap"
                >
                  {valueLabel}
                </th>
                <th
                  class="px-5 py-3 text-end font-medium text-pm-text-muted text-sm whitespace-nowrap"
                ></th>
              </tr>
            </thead>
            <tbody>
              {#each group.items as item (item.id)}
                <tr
                  class="border-b border-pm-border last:border-b-0 hover:bg-pm-bg-sunken transition-colors sm:table-row flex flex-col sm:flex-row gap-2 sm:gap-0 p-4 sm:p-0 bg-pm-bg sm:bg-transparent rounded-md sm:rounded-none border sm:border-0 sm:border-b sm:border-pm-border"
                >
                  <td class="px-5 py-3 align-top w-[var(--width-key-column)] sm:px-0 sm:py-1">
                    <span class="hidden max-sm:block text-sm font-medium text-pm-text-muted mb-1">
                      {keyLabel}
                    </span>
                    <span class="text-sm bg-pm-bg-sunken px-2 py-1 rounded-md inline-block">
                      {item.key}
                    </span>
                  </td>
                  <td class="px-5 py-3 align-top sm:px-0 sm:py-1" dir="auto">
                    <span class="hidden max-sm:block text-sm font-medium text-pm-text-muted mb-1">
                      {valueLabel}
                    </span>
                    {item.value}
                  </td>
                  <td class="px-5 py-3 text-end align-middle whitespace-nowrap sm:px-0">
                    <AdminRowActions>
                      <IconButton ariaLabel={t('common.edit')} onclick={() => onEdit(item)}>
                        <IconPencil class="size-4" />
                      </IconButton>
                      <IconButton
                        variant="danger"
                        ariaLabel={t('common.delete')}
                        onclick={() => onDelete(item)}
                      >
                        <IconTrash class="size-4" />
                      </IconButton>
                    </AdminRowActions>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </Card>
  {/each}
</div>
