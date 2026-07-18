#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const manifestPath = resolve(root, 'pm-ownership.manifest.json')

function fail(message) {
  console.error(`[pm-ownership] ERROR: ${message}`)
  process.exitCode = 1
}

function readManifest() {
  if (!existsSync(manifestPath)) {
    fail('pm-ownership.manifest.json was not found')
    return null
  }

  try {
    return JSON.parse(readFileSync(manifestPath, 'utf8'))
  } catch (error) {
    fail(`manifest is not valid JSON: ${error.message}`)
    return null
  }
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function hasGlob(path) {
  return path.includes('*')
}

function validateManifest(manifest) {
  if (!isObject(manifest)) {
    fail('manifest root must be an object')
    return
  }

  if (!Number.isInteger(manifest.version) || manifest.version < 1) {
    fail('manifest.version must be an integer >= 1')
  }

  if (!isObject(manifest.owners)) {
    fail('manifest.owners must be an object')
    return
  }

  if (!Array.isArray(manifest.paths)) {
    fail('manifest.paths must be an array')
    return
  }

  const owners = new Set(Object.keys(manifest.owners))
  const seenPaths = new Set()
  const validStatuses = new Set(['canonical', 'candidate', 'deprecated', 'conflict'])

  for (const owner of owners) {
    const meta = manifest.owners[owner]
    if (!isObject(meta) || typeof meta.description !== 'string' || meta.description.trim() === '') {
      fail(`owner "${owner}" must have a non-empty description`)
    }
  }

  for (const [index, entry] of manifest.paths.entries()) {
    const label = `paths[${index}]`

    if (!isObject(entry)) {
      fail(`${label} must be an object`)
      continue
    }

    if (typeof entry.path !== 'string' || entry.path.trim() === '') {
      fail(`${label}.path must be a non-empty string`)
      continue
    }

    if (entry.path.startsWith('/') || entry.path.includes('..')) {
      fail(`${label}.path must be a repository-relative path without ".."`)
    }

    if (seenPaths.has(entry.path)) {
      fail(`${label}.path duplicates another manifest entry: ${entry.path}`)
    }
    seenPaths.add(entry.path)

    if (!owners.has(entry.owner)) {
      fail(`${label}.owner references unknown owner "${entry.owner}"`)
    }

    if (!validStatuses.has(entry.status)) {
      fail(`${label}.status must be one of: ${Array.from(validStatuses).join(', ')}`)
    }

    if (entry.status === 'canonical' && !hasGlob(entry.path) && !existsSync(resolve(root, entry.path))) {
      fail(`${label}.path is canonical but does not exist: ${entry.path}`)
    }
  }
}

const manifest = readManifest()
if (manifest) {
  validateManifest(manifest)
}

if (process.exitCode) {
  process.exit(process.exitCode)
}

console.log('[pm-ownership] manifest is valid')
