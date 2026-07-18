/**
 * Environment Validation Plugin
 *
 * Runs at server startup to validate all required
 * environment variables before accepting requests.
 *
 * Comment 3: Enforces PM_SETTINGS_ENCRYPTION_KEY in production
 */
import { validateEnv } from '../utils/env'
import { validateSettingsEncryptionKeyValue } from '../utils/secrets'

export default defineNitroPlugin(() => {
  validateEnv()

  // Comment 3: Additional production check for encryption key
  if (process.env.NODE_ENV === 'production') {
    const encryptionKey = process.env.PM_SETTINGS_ENCRYPTION_KEY || process.env.SETTINGS_ENCRYPTION_KEY
    const validationError = validateSettingsEncryptionKeyValue(encryptionKey)

    if (validationError) {
      console.error(
        `FATAL: ${validationError}\n` +
        'This key encrypts sensitive settings (API keys, tokens) stored in the database.\n' +
        'Generate it once with `openssl rand -hex 32`, then paste the literal 64-character hexadecimal value into `.env` or your secret manager.\n' +
        'Do not store shell expressions such as `$(openssl rand -hex 32)` in `.env`.'
      )
      process.exit(1)
    }
  }
})
