import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'

const {
  configState,
  useRevealMock,
  useScrollytellingMock
} = vi.hoisted(() => ({
  configState: {
    value: {
      features: {
        pageTransitions: false,
        backToTop: false,
        onepager: false,
        interactiveHeader: false
      },
      useScrollytelling: false
    }
  },
  useRevealMock: vi.fn(),
  useScrollytellingMock: vi.fn()
}))

mockNuxtImport('useI18n', () => () => ({
  t: (key: string) => key
}))
mockNuxtImport('useReveal', () => useRevealMock)
mockNuxtImport('useScrollytelling', () => useScrollytellingMock)

vi.mock('~~/pm-core/app/composables/usePmConfig', () => ({
  usePmConfig: () => configState.value
}))

import DefaultLayout from '~/layouts/default.vue'

const stubs = {
  OrganismsTheHeader: { template: '<header class="stub-header" />' },
  OrganismsTheFooter: { template: '<footer class="stub-footer" />' },
  AtomsBackToTop: { template: '<button class="stub-back-to-top" />' }
}

describe('DefaultLayout class contract', () => {
  beforeEach(() => {
    useRevealMock.mockReset()
    useScrollytellingMock.mockReset()
  })

  it('keeps feature classes off when onepager, scrollytelling, and interactive header are disabled', async () => {
    configState.value = {
      features: {
        pageTransitions: false,
        backToTop: false,
        onepager: false,
        interactiveHeader: false
      },
      useScrollytelling: false
    }

    const wrapper = await mountSuspended(DefaultLayout, {
      slots: {
        default: '<div class="layout-body">content</div>'
      },
      global: {
        stubs
      }
    })

    expect(wrapper.classes()).toContain('layout')
    expect(wrapper.classes()).not.toContain('interactive-header')
    expect(wrapper.classes()).not.toContain('onepager')
    expect(wrapper.find('.stub-back-to-top').exists()).toBe(false)
    expect(useRevealMock).toHaveBeenCalledWith({ enabled: false })
    expect(useScrollytellingMock).toHaveBeenCalledWith({
      enabled: false,
      activationMediaQuery: '(prefers-reduced-motion: no-preference)'
    })
  })

  it('applies feature classes only when their booleans are enabled', async () => {
    configState.value = {
      features: {
        pageTransitions: false,
        backToTop: true,
        onepager: true,
        interactiveHeader: true
      },
      useScrollytelling: true
    }

    const wrapper = await mountSuspended(DefaultLayout, {
      slots: {
        default: '<div class="layout-body">content</div>'
      },
      global: {
        stubs
      }
    })

    expect(wrapper.classes()).toContain('layout')
    expect(wrapper.classes()).toContain('interactive-header')
    expect(wrapper.classes()).toContain('onepager')
    expect(wrapper.find('.stub-back-to-top').exists()).toBe(true)
    expect(useRevealMock).toHaveBeenCalledWith({ enabled: true })
    expect(useScrollytellingMock).toHaveBeenCalledWith({
      enabled: true,
      activationMediaQuery: '(prefers-reduced-motion: no-preference)'
    })
  })
})
