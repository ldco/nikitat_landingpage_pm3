# PM RTL Hero Alignment — Framework Fix

Date: 2026-06-07
Status: ENGRAVED — must be applied to ALL PM projects with RTL locales.

Derivative scope: all PM projects where `SectionHero.vue` has hardcoded `section-hero--left`.

## Problem

`app/components/sections/SectionHero.vue` hardcodes `section-hero--left` on the hero section element:

```vue
<section id="home" class="section section-fullscreen section-hero section-hero--left">
```

This overrides the `dir="rtl"` attribute on `<html>`, breaking RTL layouts for Hebrew, Arabic, Farsi, and Urdu locales. Text that should be right-aligned is forced left.

## Fix

Replace the hardcoded class with a dynamic binding using `isRtlLanguage` from `~/utils/rtl`:

```vue
<script setup lang="ts">
import { isRtlLanguage } from '~/utils/rtl'
const { locale } = useI18n()
const heroAlign = computed(() =>
  isRtlLanguage(locale.value) ? 'section-hero--right' : 'section-hero--left'
)
</script>

<template>
  <section id="home" class="section section-fullscreen section-hero" :class="heroAlign">
```

## Why This Is a Framework Issue

- The `SectionHero.vue` component is part of PM's core section library
- It ships with all new PM projects
- The hardcoded `--left` affects every project that enables RTL languages
- The fix is a one-line change in the component — no CSS changes needed

## Testing

- Hebrew (`/he/`): hero section should have `class="... section-hero--right"`, text right-aligned
- Russian (`/`): hero section should have `class="... section-hero--left"`, text left-aligned
- English (`/en/`): same as Russian
- French (`/fr/`): same as Russian
- Arabic (`/ar/`): same as Hebrew
