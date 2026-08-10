import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/lib/server/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: './data/sqlite.db'
  },
  // audit N-9: strict mode catches schema drift at generation time (PM2 parity).
  strict: true,
  verbose: true
})
