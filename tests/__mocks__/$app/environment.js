// Minimal $app/environment stub so framework modules that read `browser`/`dev`
// (e.g. the paraglide-sveltekit runtime) can be imported in the vitest node/jsdom
// environment. Mirrors SvelteKit's $app/environment surface used in this repo.
export const browser = false
export const dev = true
export const building = false
export const version = '1'
