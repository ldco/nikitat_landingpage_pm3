<script lang="ts">
  import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
  import type { PageData } from './$types'
  import * as m from '$lib/i18n'
  import { page } from '$app/stores'
  import { getAdminT } from '$lib/utils/admin-translations'
  import { createFormDirty } from '$lib/utils/form-dirty.svelte'
  let { data }: { data: PageData } = $props()
  const item = $derived(data.item)
  // data is server-loaded, does not change during edit — init is intentional
  let name = $state(item.name), slug = $state(item.slug), price = $state(item.price !== null ? String(item.price) : '')
  const { isDirty, markClean, guardNavigation } = createFormDirty(() => ({ name: name }))
  // Init clean after server-loaded data populates the form
  markClean()
  guardNavigation()

  const t = $derived(getAdminT($page.data))
  const form = $derived($page.form)
  const errors = $derived((form as { fieldErrors?: Record<string, string[]> } | null)?.fieldErrors ?? {})
</script>
<div class="max-w-[var(--max-w-content)] mx-auto">
  <div class="flex items-center gap-4 py-4 mb-6 border-b border-pm-border">
    <a href={ADMIN_ROUTES.pricing} class="text-pm-text-muted hover:text-pm-brand text-sm">&larr; {m.common_back()}</a>
    <h1 class="text-2xl font-bold text-pm-text">{m.common_edit()}</h1>
  </div>
  <form method="POST" class="max-w-lg space-y-4">
    <div>
      <label for="field-name" class="block text-sm font-medium text-pm-text mb-1">{t['admin.name']}</label>
      <input type="text" name="name" id="field-name" bind:value={name} required class="w-full px-3 py-2 border border-pm-border rounded-lg bg-pm-bg text-pm-text" />
      {#if errors.name?.[0]}<p class="text-xs text-pm-danger mt-1">{errors.name[0]}</p>{/if}
    </div>
    <div>
      <label for="field-slug" class="block text-sm font-medium text-pm-text mb-1">{t['admin.slug']}</label>
      <input type="text" name="slug" id="field-slug" bind:value={slug} required class="w-full px-3 py-2 border border-pm-border rounded-lg bg-pm-bg text-pm-text" />
      {#if errors.slug?.[0]}<p class="text-xs text-pm-danger mt-1">{errors.slug[0]}</p>{/if}
    </div>
    <div>
      <label for="field-price" class="block text-sm font-medium text-pm-text mb-1">{t['admin.price']}</label>
      <input type="number" name="price" id="field-price" bind:value={price} class="w-full px-3 py-2 border border-pm-border rounded-lg bg-pm-bg text-pm-text" />
      {#if errors.price?.[0]}<p class="text-xs text-pm-danger mt-1">{errors.price[0]}</p>{/if}
    </div>
    <button type="submit" disabled={!isDirty} class="px-4 py-2 bg-pm-brand text-white rounded-lg hover:bg-pm-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors">{m.common_save()}</button>
  </form>
</div>
