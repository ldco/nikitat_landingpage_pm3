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

  type InputType = 'text' | 'email' | 'password' | 'tel' | 'url' | 'number' | 'textarea'

  let {
    name,
    label,
    type = 'text',
    placeholder = '',
    value = '',
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
    value?: string
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
  {#if label}
    <label for={name} class={labelClass}>
      {label}
      {#if required}<span class="text-pm-danger">*</span>{/if}
    </label>
  {/if}

  {#if type === 'textarea'}
    <textarea
      {name}
      id={name}
      bind:value
      {placeholder}
      {required}
      {disabled}
      class={twMerge(clsx(inputBase, error ? inputError : inputNormal))}
      rows={4}
      oninput={oninput}
    ></textarea>
  {:else}
    <input
      {name}
      {type}
      id={name}
      bind:value
      {placeholder}
      {required}
      {disabled}
      class={twMerge(clsx(inputBase, error ? inputError : inputNormal))}
      oninput={oninput}
    />
  {/if}

  {#if error}
    <p class={errorClass}>{error}</p>
  {/if}
</div>
