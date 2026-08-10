import adapter from '@sveltejs/adapter-node'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({ precompress: true }),
    files: { assets: './public' },
    alias: {
      $lib: './src/lib'
    },
    // Nonce-based CSP (rule: no unsafe-inline in script-src / style-src).
    // SvelteKit generates a per-request nonce, attaches it to every inline
    // <script>/<style> it emits, and writes the header itself on page responses.
    //
    // Narrow documented exception: `style-src-attr 'unsafe-inline'` covers the
    // two remaining inline style ATTRIBUTES — SvelteKit's required
    // `<div style="display: contents">` body wrapper in src/app.html and the
    // dynamic skeleton widths of atoms/LoadingBase. Inline style attributes
    // cannot execute scripts and cannot load external resources; `<style>`
    // ELEMENTS (which can) remain nonce-locked. Svelte 5 transitions use the
    // Web Animations API, so they are unaffected by a nonce-only style-src.
    csp: {
      mode: 'nonce',
      directives: {
        'default-src': ['self'],
        'script-src': ['self'],
        'style-src': ['self'],
        'style-src-attr': ['unsafe-inline'],
        'img-src': ['self', 'data:', 'blob:', 'https:'],
        'font-src': ['self', 'data:'],
        'connect-src': ['self', 'https:'],
        'object-src': ['none'],
        'base-uri': ['self'],
        'form-action': ['self'],
        'frame-ancestors': ['none'],
        // audit I-6: upgrade HTTP asset references to HTTPS in production,
        // preventing mixed-content warnings (boolean directive per kit.csp).
        'upgrade-insecure-requests': true
      }
    }
  }
}

export default config
