<script lang="ts">
  /**
   * FormField — form field wrapper (input + label + error display)
   *
   * The error display reads fieldErrors from $page.form (SvelteKit form actions
   * with Zod + fail()). sveltekit-superforms is NOT used — admin forms follow
   * the manual Zod + fail() pattern (audit I-21 decision: removed dependency).
   * Rule #1: class prop + twMerge
   * Rule #3: strict union types
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  type InputType = 'text' | 'email' | 'password' | 'tel' | 'url' | 'number' | 'textarea' | 'checkbox'

  let {
    name,
    label,
    type = 'text',
    placeholder = '',
    value = $bindable(''),
    error = '',
    required = false,
    disabled = false,
    class: className = '',
    oninput
  }: {
    name: string
    label: string
    type?: InputType
    placeholder?: string
    value?: string | boolean
    error?: string
    required?: boolean
    disabled?: boolean
    class?: string
    oninput?: (e: Event) => void
  } = $props()

  const base = 'flex flex-col gap-1'
  const labelClass = 'text-sm font-medium text-pm-text'
  const inputBase = 'w-full rounded-md border px-3 py-2 text-sm transition-colors'
  const inputNormal = 'border-pm-border bg-pm-bg text-pm-text focus:border-pm-brand focus:ring-1 focus:ring-pm-brand'
  const inputError = 'border-pm-danger focus:border-pm-danger focus:ring-pm-danger'
  const errorClass = 'text-xs text-pm-danger'
</script>

<div class={twMerge(clsx(base, className))}>
  {#if label && type !== 'checkbox'}
    <label for={name} class={labelClass}>
      {label}
      {#if required}<span class="text-pm-danger">*</span>{/if}
    </label>
  {/if}

  {#if type === 'textarea'}
    <textarea
      {name}
      id={name}
      value={typeof value === 'string' ? value : ''}
      {placeholder}
      {required}
      {disabled}
      class={twMerge(clsx(inputBase, error ? inputError : inputNormal))}
      rows={4}
      oninput={(e) => {
        value = (e.currentTarget as HTMLTextAreaElement).value
        oninput?.(e)
      }}
    ></textarea>
  {:else if type === 'checkbox'}
    <label class="flex items-center gap-2 cursor-pointer">
      <input
        {name}
        {type}
        id={name}
        checked={Boolean(value)}
        {disabled}
        class="size-4 rounded border-pm-border text-pm-brand focus:ring-pm-brand"
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
      {required}
      {disabled}
      class={twMerge(clsx(inputBase, error ? inputError : inputNormal))}
      oninput={(e) => {
        value = (e.currentTarget as HTMLInputElement).value
        oninput?.(e)
      }}
    />
  {/if}

  {#if error}
    <p class={errorClass}>{error}</p>
  {/if}
</div>
