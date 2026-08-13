/**
 * Admin Delete Confirmation — the ONE in-app confirmation flow for admin
 * list-page deletions (replaces the native browser `confirm()`).
 *
 * Every admin list page routes its destructive action through this helper so
 * the confirmation experience is identical everywhere: an overlay dialog
 * (OverlayProvider confirm) with a danger-styled "Delete" action. The message
 * is built by the caller (page-local i18n wording, optionally including the
 * entity name).
 *
 * @param overlays the overlays store from getOverlaysState()
 * @param message  i18n-resolved confirmation message (may include the entity name)
 * @returns true when the user confirmed the deletion
 */
import type { OverlaysState } from '$lib/stores/overlays.svelte'
import { t } from '$lib/stores/content.svelte'

export async function confirmDeleteAction(overlays: OverlaysState, message: string): Promise<boolean> {
  return overlays.confirm({
    title: t('common.delete'),
    message,
    confirmText: t('common.delete'),
    variant: 'danger'
  })
}
