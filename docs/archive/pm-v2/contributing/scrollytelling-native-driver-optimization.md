# PM Native Scrollytelling Driver Optimization

Date: 2026-05-20

Status: implemented in this repository.

Derivative scope: all PMNative website projects that use `features.onepager` and `features.scrollytelling`.

## Goal

Keep the framework's native scroll driver as the default for Lighthouse-focused projects, while reducing layout work during scroll frames. This keeps the existing PM API stable and avoids adding Lenis or any other smooth-scroll dependency to already-built projects.

## Problem

Older PM projects may have a scrollytelling driver that calls `getBoundingClientRect()` for every scene on every scroll-driven animation frame. That is reliable, but it can force repeated layout reads exactly when the browser is trying to keep scroll smooth.

This matters most on pages with:

- many onepager sections,
- parallax layers,
- 2D/3D scrollytelling effects,
- mobile devices or low-power laptops,
- Lighthouse performance targets around 95-100.

## Framework Change

Update `app/composables/useScrollytelling.ts` so the native driver:

1. Measures scene document positions only during target refreshes.
2. Computes per-scene progress during scroll frames from cached `top`, cached `height`, `window.scrollY`, and `window.innerHeight`.
3. Stores scene progress in a `WeakMap<HTMLElement, number>` so parallax does not need `getComputedStyle()` during normal frames.
4. Debounces resize and DOM mutation refreshes through one `requestAnimationFrame`.
5. Uses optional `ResizeObserver` to refresh scene measurements when scene dimensions change after image/content load.
6. Guards `attachRuntime()` so repeated activation does not install duplicate scroll, pointer, resize, or media-query listeners.

The public contract does not change:

- `v-scrolly-scene` remains valid.
- `v-parallax` remains valid.
- `--pm-scroll-progress` remains valid.
- `--pm-scene-progress` remains valid.
- `--pm-parallax-x` and `--pm-parallax-y` remain valid.
- `features.scrollytelling` remains the feature flag.

## Files To Port

Primary implementation:

- `app/composables/useScrollytelling.ts`

Regression test:

- `tests/composables/useScrollytelling.test.ts`

No CSS migration is required if the project already uses the PM scrollytelling CSS variable contract.

## Porting Checklist

1. Open the target project's `app/composables/useScrollytelling.ts`.
2. Add a `SceneTarget` shape with `element`, `top`, and `height`.
3. Change runtime scene storage from raw `HTMLElement[]` to cached `SceneTarget[]`.
4. Add `attached`, `refreshId`, `resizeObserver`, and `sceneProgress` runtime state.
5. Replace per-frame scene `getBoundingClientRect()` calls with cached coordinate math.
6. Replace parallax scene progress reads from computed styles with the runtime `WeakMap`.
7. Debounce mutation and resize refreshes with `requestAnimationFrame`.
8. Add the focused regression test that asserts scroll frames do not create fresh `getBoundingClientRect()` calls.
9. Run:

```bash
npx vitest run tests/composables/useScrollytelling.test.ts
npm run build
```

## Compatibility Impact

Low risk. This is an internal runtime optimization with no template, directive, CSS, or config API change.

The only behavior to check manually after porting is scene progress accuracy after late-loading media. The optimized driver handles this through `ResizeObserver` where available, but image-heavy legacy projects should still be tested by scrolling from top to bottom once after a cold reload.

## Security Review

No auth, RBAC, API, storage, or user-input surface changes. The change is client-side runtime scheduling and DOM measurement only.

## DevOps Review

No deploy-time dependency change. No new package install is required. Rollback is simple: revert only `app/composables/useScrollytelling.ts` and the related test.

## Future Optional Work

Lenis can still be added later as an optional scroll driver, but it should not replace this native path. PM should keep native scroll as the default and treat Lenis as a client-only premium adapter for selected projects.
