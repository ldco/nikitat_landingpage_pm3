/**
 * Social Icon Registry — reference for adding new icons
 *
 * To add a platform:
 *   1. Create IconName.svelte in this directory using BaseIcon
 *   2. Add import + if-chain to ../SocialIcon.svelte
 *   3. Add seed data with key social.{platform}
 *
 * The directory structure IS the registry — filenames match platform names.
 */
// No barrel export needed — SocialIcon uses direct Svelte imports for type safety.
