<script lang="ts">
  /**
   * FormField — form field wrapper (label + control + error display)
   *
   * Renders a labeled control for text/email/password/tel/url/number inputs,
   * textareas, native selects and checkboxes. The error display reads
   * fieldErrors from $page.form (SvelteKit form actions with Zod + fail()).
   * sveltekit-superforms is NOT used — admin forms follow the manual
   * Zod + fail() pattern (audit I-21 decision: removed dependency).
   *
   * @props {string} name — control name/id (label association + form submission)
   * @props {string} [label=''] — field label (hidden when empty — used for row controls)
   * @props {'text'|'email'|'password'|'tel'|'url'|'number'|'textarea'|'select'|'checkbox'} [type='text'] — control type
   * @props {Array<{value: string, label: string}>} [options] — select options (type='select'); label is an i18n key or a literal, resolved by the Dropdown
   * @props {string} [placeholder=''] — input/textarea placeholder
   * @props {string} [autocomplete] — input/textarea autocomplete attribute
   * @props {number} [minlength] — input/textarea minlength attribute
   * @props {string} [inputClass] — extra classes merged onto the control itself (public-form styling)
   * @props {string|boolean} [value=''] — bound value (two-way via bind:value)
   * @props {string} [error=''] — inline error message
   * @props {string} [hint=''] — helper text under the control
   * @props {boolean} [required=false] — required marker + attribute
   * @props {boolean} [disabled=false] — disabled attribute
   * @props {number} [rows=4] — textarea row count
   * @props {string} [ariaLabel] — aria-label for label-less controls
   * @props {string} [class] — extra classes merged via twMerge
   * @props {(e: Event) => void} [oninput] — input/change callback
   *
   * @example
   * <FormField name="email" label={t('common.email')} type="email" bind:value={email} error={error} />
   * <FormField name="itemType" label={t('admin.mediaType')} type="select" options={types} bind:value={itemType} />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import Dropdown from '$lib/components/atoms/Dropdown.svelte'
  import AutoGrowTextarea from '$lib/components/atoms/AutoGrowTextarea.svelte'

  type InputType = 'text' | 'email' | 'password' | 'tel' | 'url' | 'number' | 'textarea' | 'select' | 'checkbox'
  // The DOM attribute accepts a narrow union; expose it as the element's own
  // type so `{autocomplete}` shorthand assigns without a cast.
  type AutoFill = import('svelte/elements').HTMLInputAttributes['autocomplete']

  let {
    name,
    label = '',
    type = 'text',
    options = [] as Array<{ value: string; label: string }>,
    placeholder = '',
    autocomplete = undefined as AutoFill,
    minlength,
    inputClass = '',
    value = $bindable(''),
    error = '',
    hint = '',
    required = false,
    disabled = false,
    rows = 4,
    ariaLabel = '',
    class: className = '',
    oninput
  }: {
    name: string
    label?: string
    type?: InputType
    options?: Array<{ value: string; label: string }>
    placeholder?: string
    autocomplete?: AutoFill
    minlength?: number
    inputClass?: string
    value?: string | boolean
    error?: string
    hint?: string
    required?: boolean
    disabled?: boolean
    rows?: number
    ariaLabel?: string
    class?: string
    oninput?: (e: Event) => void
  } = $props()

  const base = 'flex flex-col gap-1'
  const labelClass = 'text-sm font-medium text-pm-text'
  // Canonical PM3 admin control bundle (shared by input/textarea/select).
  const inputBase = 'w-full rounded-md border px-3 py-2 text-sm transition-colors focus:outline-none'
  const inputNormal = 'border-pm-border bg-pm-bg text-pm-text focus:border-pm-brand focus:ring-2 focus:ring-pm-focus-ring'
  const inputError = 'border-pm-danger focus:border-pm-danger focus:ring-2 focus:ring-pm-danger'
  const errorClass = 'text-xs text-pm-danger'

  // Reactive: the error state (and the public-form inputClass) can change
  // after submit, so the merged control classes must track the props.
  const controlClass = $derived(twMerge(clsx(inputBase, error ? inputError : inputNormal, inputClass)))
</script>

<div class={twMerge(clsx(base, className))}>
  {#if label && type !== 'checkbox'}
    <label for={name} class={labelClass}>
      {label}
      {#if required}<span class="text-pm-danger">*</span>{/if}
    </label>
  {/if}

  {#if type === 'textarea'}
    <AutoGrowTextarea
      {name}
      id={name}
      value={typeof value === 'string' ? value : ''}
      {placeholder}
      {autocomplete}
      {minlength}
      {required}
      {disabled}
      {rows}
      aria-label={ariaLabel || undefined}
      class={controlClass}
      oninput={(e) => {
        value = (e.currentTarget as HTMLTextAreaElement).value
        oninput?.(e)
      }}
    />
  {:else if type === 'select'}
    <Dropdown
      {name}
      bind:value={value}
      {options}
      {required}
      {disabled}
      invalid={Boolean(error)}
      ariaLabel={ariaLabel}
      inputClass={inputClass}
      oninput={oninput}
    />
  {:else if type === 'checkbox'}
    <label class="flex items-center gap-2 cursor-pointer">
      <input
        {name}
        {type}
        id={name}
        checked={Boolean(value)}
        {disabled}
        class="size-4 rounded accent-pm-brand focus:ring-2 focus:ring-pm-focus-ring"
        onchange={(e) => {
          value = (e.currentTarget as HTMLInputElement).checked
          oninput?.(e)
        }}
      />
      {#if label}
        <span class="text-sm text-pm-text">
          {label}
          {#if required}<span class="text-pm-danger">*</span>{/if}
        </span>
      {/if}
    </label>
  {:else}
    <input
      {name}
      {type}
      id={name}
      value={typeof value === 'string' ? value : ''}
      {placeholder}
      {autocomplete}
      {minlength}
      {required}
      {disabled}
      aria-label={ariaLabel || undefined}
      class={controlClass}
      oninput={(e) => {
        value = (e.currentTarget as HTMLInputElement).value
        oninput?.(e)
      }}
    />
  {/if}

  {#if hint}
    <p class="text-xs text-pm-text-muted">{hint}</p>
  {/if}

  {#if error}
    <p class={errorClass}>{error}</p>
  {/if}
</div>
