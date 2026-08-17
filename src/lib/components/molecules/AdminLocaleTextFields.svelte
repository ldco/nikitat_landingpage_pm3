<script lang="ts">
  /**
   * AdminLocaleTextFields — locale-tabbed multilingual text fields for admin forms
   *
   * Renders a SegmentedControl locale tab bar and, for the active locale, the
   * configured fields. Every locale's inputs stay MOUNTED (inactive tabs are
   * hidden with CSS), so a plain HTML form submit carries every locale's
   * overrides regardless of which tab is active. Input names follow the
   * `<field>_<locale>` scheme (e.g. `title_en`) so the page-action schema can
   * read them back. Values are kept in component state (seeded from
   * `initialValues`) so typing survives tab switches and resets when a new
   * record is loaded (the `initialValues` identity change re-seeds).
   *
   * @props {string[]} locales — locale codes rendered as tabs (typically the non-default locales)
   * @props {Record<string,string>} localeNames — display names per locale code (endonyms from LOCALE_CONFIG)
   * @props {Array<{key: string, label: string, type?: 'input'|'textarea', rows?: number}>} fields — field descriptors; labels resolved to i18n by the caller
   * @props {Record<string, Record<string,string>>} [initialValues={}] — seeded per-locale values keyed [locale][fieldKey]
   * @props {string} [class] — extra classes merged via twMerge
   *
   * @example
   * <AdminLocaleTextFields
   *   locales={['en', 'fr', 'he']}
   *   localeNames={{ en: 'English', fr: 'Français', he: 'עברית' }}
   *   fields={[
   *     { key: 'title', label: t('admin.itemTitle') },
   *     { key: 'content', label: t('admin.portfolioContent'), type: 'textarea', rows: 8 }
   *   ]}
   *   initialValues={itemTranslations}
   * />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import SegmentedControl from '$lib/components/atoms/SegmentedControl.svelte'
  import FormField from '$lib/components/atoms/FormField.svelte'

  type LocaleTextField = {
    key: string
    label: string
    type?: 'input' | 'textarea'
    rows?: number
  }

  let {
    locales,
    localeNames,
    fields,
    initialValues = {},
    class: className = ''
  }: {
    locales: string[]
    localeNames: Record<string, string>
    fields: LocaleTextField[]
    initialValues?: Record<string, Record<string, string>>
    class?: string
  } = $props()

  let activeLocale = $state(locales[0] ?? '')

  let values = $state<Record<string, Record<string, string>>>(seedValues())

  function seedValues(): Record<string, Record<string, string>> {
    const out: Record<string, Record<string, string>> = {}
    for (const locale of locales) {
      out[locale] = {}
      for (const field of fields) {
        out[locale][field.key] = initialValues[locale]?.[field.key] ?? ''
      }
    }
    return out
  }

  function fieldValue(locale: string, key: string): string {
    return values[locale]?.[key] ?? ''
  }

  function setFieldValue(locale: string, key: string, value: string): void {
    const entry = values[locale] ?? {}
    entry[key] = value
    values[locale] = entry
  }

  // Re-seed whenever a new record is loaded (initialValues identity changes).
  $effect(() => {
    activeLocale = locales[0] ?? ''
    values = seedValues()
  })
</script>

<div class={twMerge(clsx('flex flex-col gap-4', className))}>
  {#if locales.length > 0}
    <SegmentedControl
      options={locales.map(locale => ({ id: locale, label: localeNames[locale] ?? locale }))}
      active={activeLocale}
      onchange={(id) => (activeLocale = id)}
    />
  {/if}

  {#each locales as locale}
    <div class={locale === activeLocale ? '' : 'hidden'}>
      {#each fields as field}
        {#if field.type === 'textarea'}
          <FormField
            name={`${field.key}_${locale}`}
            type="textarea"
            rows={field.rows ?? 6}
            label={field.label}
            value={fieldValue(locale, field.key)}
            oninput={(e) => setFieldValue(locale, field.key, (e.currentTarget as HTMLTextAreaElement).value)}
          />
        {:else}
          <FormField
            name={`${field.key}_${locale}`}
            label={field.label}
            value={fieldValue(locale, field.key)}
            oninput={(e) => setFieldValue(locale, field.key, (e.currentTarget as HTMLInputElement).value)}
          />
        {/if}
      {/each}
    </div>
  {/each}
</div>
