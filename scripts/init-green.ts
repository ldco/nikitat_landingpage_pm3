#!/usr/bin/env npx tsx
/**
 * PM Greenfield Intake
 *
 * Builds an agent-ready context bundle from:
 * - project/init/GREENFIELD_PROJECT_START_PROMPT.md
 * - project/init/greenfield-defaults.json
 * - project/init/concept_docs/
 *
 * This command does not call an LLM. Codex, Claude, or Qwen should run it,
 * read the generated bundle, and then replace the project layer.
 */
import { createHash } from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync
} from 'node:fs'
import { dirname, extname, join, relative, resolve } from 'node:path'

type Agent = 'codex' | 'claude' | 'qwen'

interface ConceptFile {
  path: string
  sizeBytes: number
  kind: 'text' | 'asset'
  extension: string
  sha256: string
  content?: string
  truncated?: boolean
}

const rootDir = process.cwd()
const initDir = resolve(rootDir, 'project/init')
const conceptDocsDir = resolve(initDir, 'concept_docs')
const promptPath = resolve(initDir, 'GREENFIELD_PROJECT_START_PROMPT.md')
const defaultsPath = resolve(initDir, 'greenfield-defaults.json')
const generatedDir = resolve(initDir, 'generated')
const defaultOutputPath = resolve(generatedDir, 'pm-init-green-context.md')
const maxInlineBytes = 200_000

const textExtensions = new Set([
  '.md',
  '.txt',
  '.json',
  '.yml',
  '.yaml',
  '.csv',
  '.prompt',
  '.prompts',
  '.html',
  '.css',
  '.svg'
])

const agentLabels: Record<Agent, string> = {
  codex: 'Codex',
  claude: 'Claude',
  qwen: 'Qwen'
}

function parseArgs(): Record<string, string> {
  const args: Record<string, string> = {}

  for (const arg of process.argv.slice(2)) {
    if (!arg.startsWith('--')) continue
    const [key, value] = arg.slice(2).split('=')
    args[key] = value ?? 'true'
  }

  return args
}

function assertFile(path: string, label: string): void {
  if (!existsSync(path)) {
    throw new Error(`${label} not found: ${path}`)
  }
}

function walkFiles(dir: string): string[] {
  if (!existsSync(dir)) return []

  const entries = readdirSync(dir)
    .filter(entry => !entry.startsWith('.'))
    .sort((a, b) => a.localeCompare(b))

  const files: string[] = []

  for (const entry of entries) {
    const path = join(dir, entry)
    const stat = statSync(path)

    if (stat.isDirectory()) {
      files.push(...walkFiles(path))
    } else if (stat.isFile()) {
      files.push(path)
    }
  }

  return files
}

function sha256(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

function readConceptFile(path: string): ConceptFile {
  const stat = statSync(path)
  const extension = extname(path).toLowerCase()
  const relativePath = relative(rootDir, path)
  const base = {
    path: relativePath,
    sizeBytes: stat.size,
    extension: extension || '(none)',
    sha256: sha256(path)
  }

  if (!textExtensions.has(extension)) {
    return {
      ...base,
      kind: 'asset'
    }
  }

  const raw = readFileSync(path, 'utf8')
  const truncated = Buffer.byteLength(raw, 'utf8') > maxInlineBytes
  const content = truncated
    ? raw.slice(0, maxInlineBytes) + '\n\n[TRUNCATED: file exceeds inline limit]\n'
    : raw

  return {
    ...base,
    kind: 'text',
    content,
    truncated
  }
}

function formatJsonBlock(value: unknown): string {
  return '```json\n' + JSON.stringify(value, null, 2) + '\n```'
}

function formatConceptFile(file: ConceptFile): string {
  const header = [
    `### ${file.path}`,
    `- Kind: ${file.kind}`,
    `- Extension: ${file.extension}`,
    `- Size: ${file.sizeBytes} bytes`,
    `- SHA256: ${file.sha256}`
  ]

  if (file.kind === 'asset') {
    return [
      ...header,
      '',
      'Asset is not inlined. The agent should inspect or use this file directly if it is relevant to logo, image, document, migration, or brand work.'
    ].join('\n')
  }

  return [
    ...header,
    file.truncated ? '- Inline content: truncated' : '- Inline content: complete',
    '',
    '```text',
    file.content ?? '',
    '```'
  ].join('\n')
}

function buildContext(agent: Agent, outputPath: string): string {
  assertFile(promptPath, 'Greenfield prompt')
  assertFile(defaultsPath, 'Greenfield defaults')

  const prompt = readFileSync(promptPath, 'utf8')
  const defaults = JSON.parse(readFileSync(defaultsPath, 'utf8')) as unknown
  const conceptFiles = walkFiles(conceptDocsDir).map(readConceptFile)
  const textFiles = conceptFiles.filter(file => file.kind === 'text')
  const assetFiles = conceptFiles.filter(file => file.kind === 'asset')
  const generatedAt = new Date().toISOString()

  return [
    '# PM Init Green Context',
    '',
    `Generated at: ${generatedAt}`,
    `Target agent: ${agentLabels[agent]}`,
    `Output path: ${relative(rootDir, outputPath)}`,
    '',
    '## Agent Contract',
    '',
    'Use this bundle to generate a greenfield Puppet Master project layer.',
    'Preserve PM framework core. Replace PM master starter content only after mapping requirements into config, content, seed data, assets, sections, APIs, and validation tasks.',
    'If concept docs are empty or incomplete, use the defaults below instead of old project content.',
    '',
    '## Default Values',
    '',
    formatJsonBlock(defaults),
    '',
    '## Greenfield Prompt Source',
    '',
    '```text',
    prompt,
    '```',
    '',
    '## Concept Docs Inventory',
    '',
    conceptFiles.length
      ? conceptFiles.map(file => `- ${file.path} (${file.kind}, ${file.sizeBytes} bytes)`).join('\n')
      : '- No concept docs found. Use greenfield defaults.',
    '',
    `Text files: ${textFiles.length}`,
    `Asset files: ${assetFiles.length}`,
    '',
    '## Concept Docs Content',
    '',
    conceptFiles.length
      ? conceptFiles.map(formatConceptFile).join('\n\n')
      : 'No concept docs were available.',
    '',
    '## Required Next Agent Action',
    '',
    '1. Summarize concept docs and defaults.',
    '2. Identify conflicts or missing high-risk decisions.',
    '3. Generate the project layer from this context.',
    '4. Set pmMode to build after the project layer is ready.',
    '5. Reset/reseed the local database only after seed data is project-appropriate.',
    '6. Run residue audits and validation commands.',
    ''
  ].join('\n')
}

function main(): void {
  const args = parseArgs()
  const agent = (args.agent || 'codex') as Agent

  if (!['codex', 'claude', 'qwen'].includes(agent)) {
    throw new Error('--agent must be codex, claude, or qwen')
  }

  const outputPath = args.out ? resolve(rootDir, args.out) : defaultOutputPath
  mkdirSync(dirname(outputPath), { recursive: true })

  const context = buildContext(agent, outputPath)
  writeFileSync(outputPath, context, 'utf8')

  console.log('PM init green context generated')
  console.log(`Agent: ${agentLabels[agent]}`)
  console.log(`Output: ${relative(rootDir, outputPath)}`)
  console.log(`Concept docs: ${walkFiles(conceptDocsDir).length}`)
}

main()
