<script lang="ts">
  /**
   * OverlayProvider — mounts the imperative Toast + Confirm context
   *
   * Call once in a layout (e.g. +layout.svelte). After that, any descendant
   * component can call:
   *
   *   const overlays = getOverlaysState()
   *   overlays.showToast('Saved', 'success')
   *   const ok = await overlays.confirm({ title: 'Delete?', variant: 'danger' })
   *
   * Replaces the previous pattern where ToastContainer held its own local
   * state (PM v2 useToast/useConfirm parity — see stores/overlays.svelte.ts).
   *
   * @props {Snippet} children — page content rendered inside the provider
   *
   * @example
   * <OverlayProvider><App /></OverlayProvider>
   */
  import { setOverlaysContext } from '$lib/stores/overlays.svelte'
  import ToastContainer from './ToastContainer.svelte'
  import ConfirmDialog from './ConfirmDialog.svelte'

  let { children }: { children?: import('svelte').Snippet } = $props()

  setOverlaysContext()
</script>

{@render children?.()}

<ToastContainer />
<ConfirmDialog />
