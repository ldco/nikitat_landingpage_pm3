<script lang="ts">
  import type { PageData } from './$types'
  import { page } from '$app/stores'
  import { t } from '$lib/stores/content.svelte'
  import { getOverlaysState } from '$lib/stores/overlays.svelte'
  import { confirmDeleteAction } from '$lib/utils/admin-confirm'
  import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
  import { getAdminT } from '$lib/utils/admin-translations'
  import { adminDelete } from '$lib/api/client'
  import PageHeader from '$lib/components/atoms/PageHeader.svelte'
  import EmptyState from '$lib/components/atoms/EmptyState.svelte'
  import Badge from '$lib/components/atoms/Badge.svelte'
  import AdminCreateButton from '$lib/components/atoms/AdminCreateButton.svelte'
  import IconButton from '$lib/components/atoms/IconButton.svelte'
  import AdminRowActions from '$lib/components/atoms/AdminRowActions.svelte'
  import InlineBannerAction from '$lib/components/atoms/InlineBannerAction.svelte'
  import Pagination from '$lib/components/molecules/Pagination.svelte'
  import IconPencil from '@tabler/icons-svelte/icons/pencil'
  import IconTrash from '@tabler/icons-svelte/icons/trash'
  import IconPhoto from '@tabler/icons-svelte/icons/photo'
  import { goto } from '$app/navigation'

  interface BlogItem {
    id: number
    slug: string
    coverImageUrl: string | null
    published: boolean
    publishedAt: Date | null
    categoryId: number | null
    title: string
    category: string | null
    tags: string[]
    locales: string[]
  }

  let { data }: { data: PageData } = $props()
  const items = $derived(data.items as BlogItem[])
  const adminT = $derived(getAdminT($page.data))
  const overlays = getOverlaysState()
  let deletePending = $state<number | null>(null)
  let deleteError = $state<string | null>(null)
  let currentPage = $state(1)
  $effect.pre(() => {
    currentPage = data.pagination?.page ?? 1
  })

  async function handleDelete(id: number, title: string) {
    const msg = adminT['admin.confirmDelete'] ?? t('common.areYouSure')
    const confirmed = await confirmDeleteAction(overlays, `${msg} "${title}"?`)
    if (!confirmed) return
    deletePending = id
    deleteError = null
    try {
      const result = await adminDelete('blog', id)
      if (!result.success) {
        deleteError = result.error?.message ?? t('common.error')
        return
      }
      goto(ADMIN_ROUTES.blog)
    } catch (e: unknown) {
      console.error('[admin] blog delete failed:', e instanceof Error ? e.message : e)
      deleteError = t('common.error')
    } finally {
      deletePending = null
    }
  }
</script>

<div class="max-w-[var(--max-w-content)] mx-auto">
  <PageHeader title={adminT['admin.blog'] ?? t('admin.blog')}>
    {#snippet actions()}
      <AdminCreateButton href={ADMIN_ROUTES.blogCreate} />
    {/snippet}
  </PageHeader>

  {#if deleteError}
    <div class="mb-4 p-3 bg-pm-danger-bg border border-pm-danger rounded-[var(--radius-lg)] text-sm text-pm-danger">
      {deleteError}
      <InlineBannerAction onclick={() => deleteError = null}>{t('common.dismiss')}</InlineBannerAction>
    </div>
  {/if}

  <div class="mt-6">
    {#if items.length === 0}
      <EmptyState type="empty-box" size="compact" title={t('common.noResults')} />
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {#each items as post (post.id)}
          <div class="bg-[var(--card-shell-bg)] border border-pm-border rounded-[var(--card-shell-radius)] overflow-hidden flex flex-col">
            <div class="relative h-40 bg-pm-bg-sunken flex items-center justify-center">
              {#if post.coverImageUrl}
                <img src={post.coverImageUrl} alt="" class="w-full h-full object-cover" />
              {:else}
                <IconPhoto class="size-10 text-pm-text-muted/40" />
              {/if}
              <div class="absolute top-2 right-2">
                <Badge variant={post.published ? 'success' : 'default'}>
                  {post.published ? (adminT['admin.published'] ?? t('admin.published')) : (adminT['admin.draft'] ?? t('admin.draft'))}
                </Badge>
              </div>
            </div>
            <div class="p-4 flex-1 flex flex-col gap-2">
              <h3 class="font-semibold text-pm-text leading-snug">{post.title}</h3>
              {#if post.publishedAt}
                <p class="text-xs text-pm-text-muted">
                  {new Date(post.publishedAt).toLocaleDateString()}
                </p>
              {/if}
              {#if post.category}
                <Badge variant="primary">{post.category}</Badge>
              {/if}
              {#if post.tags.length > 0}
                <div class="flex flex-wrap gap-1 mt-auto">
                  {#each post.tags as tag}
                    <span class="px-1.5 py-0.5 text-xs rounded bg-pm-bg-sunken text-pm-text-muted">{tag}</span>
                  {/each}
                </div>
              {/if}
              {#if post.locales.length > 0}
                <div class="flex gap-1 mt-1">
                  {#each post.locales as loc}
                    <span class="px-1.5 py-0.5 text-xs rounded font-mono bg-pm-bg-sunken text-pm-text-muted uppercase">{loc}</span>
                  {/each}
                </div>
              {/if}
              <AdminRowActions class="pt-2 border-t border-pm-border mt-auto">
                <IconButton href={ADMIN_ROUTES.blogEdit(post.id)} ariaLabel={t('common.edit')}>
                  <IconPencil class="size-4" />
                </IconButton>
                <IconButton
                  variant="danger"
                  ariaLabel={t('common.delete')}
                  disabled={deletePending === post.id}
                  onclick={() => handleDelete(post.id, post.title)}
                >
                  <IconTrash class="size-4" />
                </IconButton>
              </AdminRowActions>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  {#if data.pagination && data.pagination.totalPages > 1}
    <div class="mt-6">
      <Pagination
        bind:page={currentPage}
        totalPages={data.pagination.totalPages}
        onPageChange={(p) => goto('?page=' + p)}
      />
    </div>
  {/if}
</div>
