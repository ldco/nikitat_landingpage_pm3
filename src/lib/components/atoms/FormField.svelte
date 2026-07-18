<script lang="ts">
  /**
   * FormField — Superforms-aware form field wrapper
   *
   * Wraps input + label + error display from superforms $errors.
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
  const labelClass = 'text-sm font-medium text-pm-black dark:text-pm-white'
  const inputBase = 'w-full rounded-md border px-3 py-2 text-sm transition-colors'
  const inputNormal = 'border-gray-300 bg-pm-white text-pm-black focus:border-pm-brand focus:ring-1 focus:ring-pm-brand dark:border-gray-600 dark:bg-gray-800 dark:text-pm-white'
  const inputError = 'border-red-500 focus:border-red-500 focus:ring-red-500'
  const errorClass = 'text-xs text-red-500'
</script>

<div class={twMerge(clsx(base, className))}>
  {#if label}
    <label for={name} class={labelClass}>
      {label}
      {#if required}<span class="text-red-500">*</span>{/if}
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
