<script setup lang="ts">
/**
 * Admin Roles Page
 *
 * Full CRUD interface for managing roles and permissions.
 * Master-only access.
 */
import IconCrown from '~icons/tabler/crown'
import IconUserShield from '~icons/tabler/user-shield'
import IconPencil from '~icons/tabler/pencil'
import IconPlus from '~icons/tabler/plus'
import IconEdit from '~icons/tabler/edit'
import IconTrash from '~icons/tabler/trash'
import IconX from '~icons/tabler/x'
import IconCheck from '~icons/tabler/check'
import IconLock from '~icons/tabler/lock'
import IconStar from '~icons/tabler/star'
import IconHeart from '~icons/tabler/heart'
import IconBolt from '~icons/tabler/bolt'
import IconShield from '~icons/tabler/shield'
import IconKey from '~icons/tabler/key'
import IconUsers from '~icons/tabler/users'
import type { Role, RolePermissions, AdminPageId } from '~~/pm-core/app/types'
import { ADMIN_PAGE_IDS } from '~~/pm-core/app/types'

interface RoleWithIcon extends Role {
  icon?: string | null
}

// Icon options for custom roles
const iconOptions = [
  { value: 'pencil', labelKey: 'admin.iconPencil', component: IconPencil },
  { value: 'star', labelKey: 'admin.iconStar', component: IconStar },
  { value: 'heart', labelKey: 'admin.iconHeart', component: IconHeart },
  { value: 'bolt', labelKey: 'admin.iconBolt', component: IconBolt },
  { value: 'shield', labelKey: 'admin.iconShield', component: IconShield },
  { value: 'key', labelKey: 'admin.iconKey', component: IconKey },
  { value: 'users', labelKey: 'admin.iconUsers', component: IconUsers }
]

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  pageTransition: false
})

const { t } = useI18n()

useHead({
  title: () => `${t('admin.navRoles')} | ${t('admin.titleSuffix')}`
})

const { confirm } = useConfirm()
const { toast } = useToast()

// Fetch roles
const headers = useRequestHeaders(['cookie'])
const { data, pending, refresh } = await useFetch<{ roles: Role[] }>('/api/admin/roles', {
  headers
})
const roles = computed(() => data.value?.roles || [])

// Modal state
const showModal = ref(false)
const editingRole = ref<Role | null>(null)
const saving = ref(false)

// Form data (level is auto-calculated from permissions on the server)
const form = reactive({
  name: '',
  slug: '',
  description: '',
  color: 'secondary' as string,
  icon: 'pencil' as string,
  permissions: {} as RolePermissions
})
const { isDirty: isRoleDirty, markClean: markRoleClean } = useFormDirty(() => ({
  name: form.name,
  slug: form.slug,
  description: form.description,
  color: form.color,
  icon: form.icon,
  permissions: { ...form.permissions }
}))

// Initialize permissions with defaults for new role
function getDefaultPermissions(): RolePermissions {
  const perms: RolePermissions = {}
  // New roles get basic content pages by default
  for (const pageId of ADMIN_PAGE_IDS) {
    perms[pageId] = false
  }
  return perms
}

// Page groups for organized display in form and table
const pageGroups = [
  {
    label: 'admin.systemPages',
    pages: ['users', 'roles', 'translations', 'settings', 'health'] as const
  },
  {
    label: 'admin.contentPages',
    pages: ['sections', 'blog', 'portfolios', 'team', 'testimonials', 'faq', 'clients', 'pricing', 'features', 'contacts'] as const
  }
]

const colorOptions = [
  { value: 'primary', labelKey: 'admin.badgePrimary', class: 'badge-primary' },
  { value: 'secondary', labelKey: 'admin.badgeSecondary', class: 'badge-secondary' },
  { value: 'warning', labelKey: 'admin.badgeWarning', class: 'badge-warning' },
  { value: 'success', labelKey: 'admin.badgeSuccess', class: 'badge-success' },
  { value: 'danger', labelKey: 'admin.badgeDanger', class: 'badge-danger' }
]

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function openCreateModal() {
  editingRole.value = null
  form.name = ''
  form.slug = ''
  form.description = ''
  form.color = 'secondary'
  form.icon = 'pencil'
  form.permissions = getDefaultPermissions()
  markRoleClean()
  showModal.value = true
}

function openEditModal(role: Role) {
  if (role.slug === 'master') return
  editingRole.value = role
  form.name = role.name
  form.slug = role.slug
  form.description = role.description || ''
  form.color = role.color
  form.icon = (role as RoleWithIcon).icon || 'pencil'
  form.permissions = { ...role.permissions }
  markRoleClean()
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingRole.value = null
}

// Auto-generate slug when name changes (only for new roles)
watch(() => form.name, newName => {
  if (!editingRole.value && newName) {
    form.slug = generateSlug(newName)
  }
})

async function saveRole() {
  if (!isRoleDirty.value) return

  saving.value = true

  try {
    if (editingRole.value) {
      // Update existing role
      await apiFetch(`/api/admin/roles/${editingRole.value.id}`, {
        method: 'PUT',
        body: {
          name: form.name,
          slug: form.slug,
          description: form.description || null,
          color: form.color,
          icon: form.icon,
          permissions: form.permissions
        }
      })
    } else {
      // Create new role
      await apiFetch('/api/admin/roles', {
        method: 'POST',
        body: {
          name: form.name,
          slug: form.slug,
          description: form.description || null,
          color: form.color,
          icon: form.icon,
          permissions: form.permissions
        }
      })
    }
    markRoleClean()
    closeModal()
    toast.success(t('common.saved'))
    await refresh()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    toast.error(err.data?.message || t('admin.failedSaveRole'))
  } finally {
    saving.value = false
  }
}

const deleting = ref<number | null>(null)

async function deleteRole(role: Role) {
  if (role.isBuiltIn) {
    toast.error(t('admin.cannotDeleteBuiltIn'))
    return
  }
  if (role.userCount && role.userCount > 0) {
    toast.error(t('admin.roleHasUsers'))
    return
  }

  const confirmed = await confirm(t('admin.confirmDeleteRole'), {
    title: t('common.delete'),
    confirmText: t('common.delete'),
    variant: 'danger'
  })
  if (!confirmed) return

  deleting.value = role.id
  try {
    await apiFetch(`/api/admin/roles/${role.id}`, { method: 'DELETE' })
    await refresh()
    toast.success(t('common.deleted'))
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    toast.error(err.data?.message || t('admin.failedDeleteRole'))
  } finally {
    deleting.value = null
  }
}

function getRoleIcon(role: Role) {
  if (role.slug === 'master') return IconCrown
  if (role.slug === 'admin') return IconUserShield
  // For custom roles, use stored icon
  const iconValue = (role as RoleWithIcon).icon || 'pencil'
  const iconOpt = iconOptions.find(i => i.value === iconValue)
  return iconOpt?.component || IconPencil
}

function getBadgeClass(color: string) {
  return `badge-${color}`
}

function getPageLabel(pageId: string) {
  return t(`admin.nav${pageId.charAt(0).toUpperCase() + pageId.slice(1)}`)
}
</script>

<template>
  <div class="admin-roles">
    <div class="page-header">
      <h1 class="page-title">{{ t('admin.roles') }}</h1>
      <div class="page-actions">
        <button class="btn btn-primary" @click="openCreateModal">
          <IconPlus />
          {{ t('admin.addRole') }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="loading-state">{{ t('common.loading') }}</div>

    <!-- Roles -->
    <div v-else>
      <div class="card roles-table-card">
        <table class="data-table roles-table">
          <thead>
            <tr>
              <th>{{ t('admin.permissions') }}</th>
              <th v-for="role in roles" :key="role.id" class="role-header">
                <span class="role-cell">
                  <component :is="getRoleIcon(role)" class="role-icon" />
                  <span class="badge" :class="getBadgeClass(role.color)">
                    {{ role.name }}
                  </span>
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            <!-- Actions row (first for quick access) -->
            <tr class="actions-row">
              <td class="perm-label">{{ t('admin.actions') }}</td>
              <td v-for="role in roles" :key="role.id">
                <div class="actions-cell">
                  <template v-if="role.slug === 'master'">
                    <IconLock class="locked-icon" :title="t('admin.builtInRole')" />
                  </template>
                  <template v-else>
                    <button
                      class="btn btn-icon btn-ghost btn-sm"
                      @click="openEditModal(role)"
                      :title="t('common.edit')"
                    >
                      <IconEdit />
                    </button>
                    <button
                      class="btn btn-icon btn-ghost btn-danger btn-sm"
                      @click="deleteRole(role)"
                      :disabled="deleting === role.id || role.isBuiltIn || (role.userCount ?? 0) > 0"
                      :title="t('common.delete')"
                    >
                      <IconTrash />
                    </button>
                  </template>
                </div>
              </td>
            </tr>
            <!-- Page access rows (grouped) -->
            <template v-for="group in pageGroups" :key="group.label">
              <tr class="group-header-row">
                <td :colspan="roles.length + 1" class="group-header">
                  {{ t(group.label) }}
                </td>
              </tr>
              <tr v-for="pageId in group.pages" :key="pageId">
                <td class="perm-label">{{ getPageLabel(pageId) }}</td>
                <td v-for="role in roles" :key="role.id">
                  <span class="perm-icon">
                    <IconCheck v-if="role.permissions[pageId]" class="perm-yes" />
                    <IconX v-else class="perm-no" />
                  </span>
                </td>
              </tr>
            </template>
            <!-- Users count row -->
            <tr class="info-row">
              <td class="perm-label">{{ t('admin.usersCount') }}</td>
              <td v-for="role in roles" :key="role.id" class="text-center">
                {{ role.userCount || 0 }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="roles-mobile-list">
        <article v-for="role in roles" :key="`mobile-${role.id}`" class="card role-mobile-card">
          <div class="card-body role-mobile-card__body">
            <div class="role-mobile-card__header">
              <div class="role-mobile-card__identity">
                <component :is="getRoleIcon(role)" class="role-icon role-mobile-card__icon" />
                <div class="role-mobile-card__title-wrap">
                  <span class="badge" :class="getBadgeClass(role.color)">
                    {{ role.name }}
                  </span>
                  <p v-if="role.description" class="role-mobile-card__description">
                    {{ role.description }}
                  </p>
                </div>
              </div>

              <span class="role-mobile-card__meta">
                {{ t('admin.usersCount') }}: {{ role.userCount || 0 }}
              </span>
            </div>

            <div v-for="group in pageGroups" :key="`${role.id}-${group.label}`" class="role-mobile-card__group">
              <h3 class="role-mobile-card__group-title">{{ t(group.label) }}</h3>
              <ul class="role-mobile-card__permissions">
                <li
                  v-for="pageId in group.pages"
                  :key="`${role.id}-${pageId}`"
                  class="role-mobile-card__permission"
                >
                  <span class="role-mobile-card__permission-label">
                    {{ getPageLabel(pageId) }}
                  </span>
                  <span
                    class="role-mobile-card__permission-state"
                    :class="role.permissions[pageId] ? 'is-allowed' : 'is-blocked'"
                  >
                    <IconCheck v-if="role.permissions[pageId]" class="perm-yes" />
                    <IconX v-else class="perm-no" />
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div class="card-actions role-mobile-card__actions">
            <template v-if="role.slug === 'master'">
              <span class="role-mobile-card__locked">
                <IconLock class="locked-icon" />
                {{ t('admin.builtInRole') }}
              </span>
            </template>
            <template v-else>
              <button class="btn btn-sm btn-secondary" @click="openEditModal(role)">
                <IconEdit />
                {{ t('common.edit') }}
              </button>
              <button
                class="btn btn-sm btn-ghost text-error"
                @click="deleteRole(role)"
                :disabled="deleting === role.id || role.isBuiltIn || (role.userCount ?? 0) > 0"
              >
                <IconTrash />
              </button>
            </template>
          </div>
        </article>
      </div>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
        <div class="modal modal-lg">
          <header class="modal-header">
            <h2>{{ editingRole ? t('admin.editRole') : t('admin.addRole') }}</h2>
            <button class="btn btn-ghost btn-sm" @click="closeModal">
              <IconX />
            </button>
          </header>

          <form class="modal-body" @submit.prevent="saveRole">
            <div class="form-row--2col">
              <div class="form-group">
                <label for="name" class="form-label">{{ t('admin.name') }} *</label>
                <input id="name" v-model="form.name" type="text" class="input" required />
              </div>
              <div class="form-group">
                <label for="slug" class="form-label">{{ t('admin.slug') }} *</label>
                <input
                  id="slug"
                  v-model="form.slug"
                  type="text"
                  class="input"
                  required
                  pattern="^[a-z][a-z0-9-]*$"
                  :disabled="!!editingRole"
                />
              </div>
            </div>

            <div class="form-group">
              <label for="description" class="form-label">{{ t('admin.description') }}</label>
              <input id="description" v-model="form.description" type="text" class="input" />
            </div>

            <div class="form-row--2col">
              <div class="form-group">
                <label for="color" class="form-label">{{ t('admin.badgeColor') }}</label>
                <select id="color" v-model="form.color" class="input">
                  <option v-for="opt in colorOptions" :key="opt.value" :value="opt.value">
                    {{ t(opt.labelKey) }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label for="icon" class="form-label">{{ t('admin.icon') }}</label>
                <select id="icon" v-model="form.icon" class="input">
                  <option v-for="iconOpt in iconOptions" :key="iconOpt.value" :value="iconOpt.value">
                    {{ t(iconOpt.labelKey) }}
                  </option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">{{ t('admin.pageAccess') }}</label>
              <div class="page-access-groups">
                <div v-for="group in pageGroups" :key="group.label" class="page-group">
                  <div class="page-group-header">{{ t(group.label) }}</div>
                  <div class="permissions-grid">
                    <label v-for="pageId in group.pages" :key="pageId" class="checkbox-label">
                      <input
                        type="checkbox"
                        v-model="form.permissions[pageId]"
                        class="checkbox"
                      />
                      <span>{{ t(`admin.nav${pageId.charAt(0).toUpperCase() + pageId.slice(1)}`) }}</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </form>

          <footer class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">
              {{ t('common.cancel') }}
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="saving || !isRoleDirty"
              @click="saveRole"
            >
              {{ saving ? t('common.saving') : t('common.save') }}
            </button>
          </footer>
        </div>
      </div>
    </Teleport>
  </div>
</template>
