import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/svelte'
import AutoGrowTextarea from '$lib/components/atoms/AutoGrowTextarea.svelte'

describe('AutoGrowTextarea — grows with content instead of scrolling in a keyhole', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders a textarea with the starting rows and the auto-grow classes', () => {
    render(AutoGrowTextarea, { props: { rows: 3 } })
    const ta = screen.getByRole('textbox')
    expect(ta.getAttribute('rows')).toBe('3')
    expect(ta.className).toContain('max-h-[var(--textarea-max-height)]')
    expect(ta.className).toContain('resize-none')
  })

  it('resizes to the content height on mount and after value changes', async () => {
    render(AutoGrowTextarea, { props: { value: 'some existing content' } })
    const ta = screen.getByRole('textbox')
    // The resize effect sizes the box from its scrollHeight (jsdom reports 0,
    // so the assertion is that the resize mechanism ran, not the pixel value).
    expect(ta.style.height).not.toBe('')

    await fireEvent.input(ta, { target: { value: 'more content typed in' } })
    expect((ta as HTMLTextAreaElement).value).toBe('more content typed in')
    // The effect re-runs on every value change (typing path via bind:value).
    expect(ta.style.height).not.toBe('')
  })

  it('forwards textarea attributes and event handlers', async () => {
    let fired = 0
    render(AutoGrowTextarea, {
      props: {
        placeholder: 'Type here',
        required: true,
        dir: 'auto',
        'aria-label': 'translation value',
        oninput: () => { fired += 1 }
      }
    })
    const ta = screen.getByRole('textbox', { name: 'translation value' })
    expect(ta.getAttribute('placeholder')).toBe('Type here')
    expect(ta).toHaveProperty('required', true)
    expect(ta.getAttribute('dir')).toBe('auto')

    await fireEvent.input(ta, { target: { value: 'x' } })
    expect(fired).toBe(1)
  })

  it('supports bind:value (DOM reflects typed input)', async () => {
    render(AutoGrowTextarea, { props: { value: 'initial' } })
    const ta = screen.getByRole('textbox')
    await fireEvent.input(ta, { target: { value: 'bound update' } })
    expect((ta as HTMLTextAreaElement).value).toBe('bound update')
  })

  it('merges caller classes via twMerge', () => {
    render(AutoGrowTextarea, { props: { class: 'font-mono' } })
    expect(screen.getByRole('textbox').className).toContain('font-mono')
  })
})
