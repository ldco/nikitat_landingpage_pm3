<script lang="ts">
  import OverlayProvider from '$lib/components/complex/OverlayProvider.svelte'
  import TranslationEditorModal from '$lib/components/admin/translations/TranslationEditorModal.svelte'

  let {
    open = false,
    editingKey = null,
    editingLocale = null,
    editValue = '',
    locales = [] as string[],
    localeNames = {} as Record<string, string>,
    onClose,
    onSaved
  }: {
    open?: boolean
    editingKey?: string | null
    editingLocale?: string | null
    editValue?: string
    locales?: string[]
    localeNames?: Record<string, string>
    onClose: () => void
    onSaved: (wasEdit: boolean) => void
  } = $props()
</script>

<OverlayProvider>
  <TranslationEditorModal
    {open}
    {editingKey}
    {editingLocale}
    {editValue}
    {locales}
    {localeNames}
    {onClose}
    {onSaved}
  />
</OverlayProvider>
