<script lang="ts">
  /**
   * AdminDataTable — shared data table for admin pages
   *
   * Visual parity with PM v2 `ui/content/data-table.css` (251 lines):
   *   - Header cells: bg-sunken, font-medium, text-sm, secondary color
   *   - Body cells: px-4 py-3, border-b, row hover bg-sunken
   *   - Key column: 35% width, <code> chip styling
   *   - Value column: cursor-pointer, hover brand-subtle (editable)
   *   - Actions column: right-aligned, nowrap
   *   - Mobile: rows become cards, labels from data-label attrs
   *
   * Cell content is rendered through the `cell` snippet (branch on
   * column.key); an `actions` snippet renders the trailing actions column.
   *
   * @props columns — column definitions ({ key, label, dataLabel?, widthClass? })
   * @props items — rows to render
   * @props emptyMessage — i18n string for the empty state
   * @props loading — show skeleton rows instead of data
   * @props loadingRows — number of skeleton rows while loading
   * @props cell — snippet(column, row) rendered for every cell
   * @props actions — snippet(row) rendered in the trailing actions column
   *
   * @example
   * <AdminDataTable columns={columns} items={rows} emptyMessage={t('admin.empty')}>
   *   {#snippet cell(column, row)}
   *     {row[column.key]}
   *   {/snippet}
   * </AdminDataTable>
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  export interface AdminTableColumn {
    key: string
    label: string
    /** Mobile card label (defaults to label) */
    dataLabel?: string
    /** Width/alignment utility, e.g. 'w-[35%]' for the key column */
    widthClass?: string
  }

  let {
    columns,
    items,
    emptyMessage,
    loading = false,
    loadingRows = 3,
    class: className = '',
    cell,
    actions
  }: {
    columns: AdminTableColumn[]
    items: unknown[]
    emptyMessage: string
    loading?: boolean
    loadingRows?: number
    class?: string
    cell?: import('svelte').Snippet<[AdminTableColumn, unknown]>
    actions?: import('svelte').Snippet<[unknown]>
  } = $props()

  const merged = $derived(twMerge(clsx(
    'w-full overflow-x-auto bg-pm-bg-elevated rounded-xl border border-pm-border',
    className
  )))
</script>

<div class={merged}>
  <table class="w-full border-collapse text-sm">
    <!-- PM2: thead hidden on mobile (rows become cards) -->
    <thead class="max-sm:hidden bg-pm-bg-sunken">
      <tr>
        {#each columns as column (column.key)}
          <th class={clsx(
            'px-5 py-3 text-start font-medium text-pm-text-muted text-sm whitespace-nowrap border-b border-pm-border',
            column.widthClass
          )}>
            {column.label}
          </th>
        {/each}
        {#if actions}
          <th class="px-5 py-3 text-end font-medium text-pm-text-muted text-sm whitespace-nowrap border-b border-pm-border"></th>
        {/if}
      </tr>
    </thead>
    <tbody class="max-sm:flex max-sm:flex-col max-sm:gap-3 max-sm:p-3">
      {#if loading}
        {#each Array(loadingRows) as _, i (i)}
          <tr class="border-b border-pm-border max-sm:flex max-sm:flex-col max-sm:gap-2 max-sm:p-4 max-sm:bg-pm-bg max-sm:border max-sm:border-pm-border max-sm:rounded-md">
            {#each columns as column (column.key)}
              <td class="px-5 py-3 max-sm:px-0 max-sm:py-1">
                <div class="h-4 rounded bg-pm-bg-sunken animate-pulse"></div>
              </td>
            {/each}
            {#if actions}
              <td class="px-5 py-3 max-sm:px-0 max-sm:py-1"></td>
            {/if}
          </tr>
        {/each}
      {:else if items.length === 0}
        <tr class="border-b border-pm-border max-sm:border-0">
          <td colspan={columns.length + (actions ? 1 : 0)} class="px-5 py-10 text-center text-sm text-pm-text-muted">
            {emptyMessage}
          </td>
        </tr>
      {:else}
        {#each items as item, i (String((item as { id?: unknown })?.id ?? i))}
          <tr class="border-b border-pm-border last:border-b-0 hover:bg-pm-bg-sunken transition-colors max-sm:flex max-sm:flex-col max-sm:gap-3 max-sm:p-5 max-sm:bg-pm-bg max-sm:border max-sm:border-pm-border max-sm:rounded-lg max-sm:hover:bg-pm-bg">
            {#if actions}
              <!-- Mobile: actions row pinned to the TOP-RIGHT of the card (PM2 parity) -->
              <td class="hidden max-sm:flex max-sm:justify-end max-sm:items-center max-sm:px-0 max-sm:py-0 max-sm:border-0 max-sm:-mb-1">
                {@render actions(item)}
              </td>
            {/if}
            {#each columns as column (column.key)}
              <td
                data-label={column.dataLabel ?? column.label}
                class={clsx(
                  'px-5 py-3 align-top max-sm:flex max-sm:flex-col max-sm:gap-1 max-sm:items-start max-sm:px-0 max-sm:py-1 max-sm:border-0',
                  column.widthClass
                )}
              >
                <span class="hidden max-sm:block text-xs font-medium uppercase tracking-wide text-pm-text-muted">{column.dataLabel ?? column.label}</span>
                <div class="max-sm:text-base max-sm:text-pm-text">
                  {#if cell}
                    {@render cell(column, item)}
                  {/if}
                </div>
              </td>
            {/each}
            {#if actions}
              <!-- Desktop: real trailing actions cell (the mobile-only slot above
                   kept row actions hidden ≥sm — edit/delete were unreachable on
                   desktop). Mirrors the empty header cell rendered in thead. -->
              <td class="hidden sm:table-cell px-5 py-3 text-end align-middle whitespace-nowrap">
                {@render actions(item)}
              </td>
            {/if}
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
</div>
