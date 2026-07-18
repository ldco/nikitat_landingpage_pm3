import { setup } from '@nuxt/test-utils/e2e'
import { waitFor } from './helpers'

export async function setupApiTest(port: number) {
  await setup({
    server: true,
    browser: false,
    port
  })
}

export async function waitForApiServer(port: number) {
  await waitFor(
    async () => {
      try {
        const response = await fetch(`http://127.0.0.1:${port}/api/health`)
        return response.ok
      } catch {
        return false
      }
    },
    {
      timeout: 60000,
      interval: 250
    }
  )
}
