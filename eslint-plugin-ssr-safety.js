/**
 * ESLint Plugin — PM3 SSR Safety
 *
 * Replaces the PM2-era plugin (audit N-7). PM2's version only matched Vue
 * files and checked for `puppet-master.config` access patterns that no longer
 * exist in PM3. This rewrite enforces a PM3-relevant rule: framework/client
 * Svelte components must not import server-only modules directly.
 */

const noServerImportsInClient = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow importing server-only modules ($lib/server/**) into client Svelte components. Server code (DB, auth, storage) must stay server-side.',
      category: 'SSR Safety',
      recommended: 'warn'
    },
    schema: [],
    messages: {
      serverImport:
        'Client component imports a server-only module ("{{path}}"). Move this logic to a +page.server.ts/+server.ts loader and pass data via props (Route Contract).'
    }
  },
  create(context) {
    const filename = context.getFilename()
    const isSvelte = filename.endsWith('.svelte')

    if (!isSvelte) return {}

    return {
      ImportDeclaration(node) {
        // Type-only imports are erased at compile time — no runtime server dep.
        if (node.importKind === 'type') return
        const value = node.source?.value
        if (typeof value === 'string' && /^\$lib\/server\//.test(value)) {
          context.report({
            node,
            messageId: 'serverImport',
            data: { path: value }
          })
        }
      },
      CallExpression(node) {
        // dynamic import('$lib/server/...') in client components
        if (node.callee?.type === 'Import' && node.arguments[0]?.type === 'Literal') {
          const value = node.arguments[0].value
          if (typeof value === 'string' && /^\$lib\/server\//.test(value)) {
            context.report({
              node,
              messageId: 'serverImport',
              data: { path: value }
            })
          }
        }
      }
    }
  }
}

export default {
  rules: {
    'no-server-imports-in-client': noServerImportsInClient
  }
}
